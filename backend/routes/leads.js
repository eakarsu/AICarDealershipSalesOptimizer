const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { scoreLead } = require('../services/openrouter');

// Audit log helper
async function auditLog(userId, action, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, action, JSON.stringify(details)]
    );
  } catch (err) {
    // Audit failures should not break the main flow
    console.error('Audit log error:', err.message);
  }
}

// Validation rules
const leadValidation = [
  body('customer_name').trim().notEmpty().withMessage('customer_name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('phone').optional().trim(),
  body('source').trim().notEmpty().withMessage('source is required'),
  body('interest_type').trim().notEmpty().withMessage('interest_type is required'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'lost', 'converted']).withMessage('Invalid status'),
];

// GET /api/leads - with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const assignedTo = req.query.assigned_to;

    let whereClause = '';
    const params = [];
    if (assignedTo) {
      params.push(assignedTo);
      whereClause = `WHERE assigned_to = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM leads ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/unassigned
router.get('/unassigned', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL`);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM leads WHERE assigned_to IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads
router.post('/', authenticateToken, leadValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { customer_name, email, phone, source, interest_type, vehicle_interest, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (customer_name, email, phone, source, interest_type, vehicle_interest, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [customer_name, email, phone, source, interest_type, vehicle_interest, status || 'new', notes]
    );
    await auditLog(req.user.id, 'lead_created', { lead_id: result.rows[0].id, customer_name });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leads/:id
router.put('/:id', authenticateToken, leadValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { customer_name, email, phone, source, interest_type, vehicle_interest, status, notes, last_contact } = req.body;
    const result = await pool.query(
      `UPDATE leads SET customer_name=$1, email=$2, phone=$3, source=$4, interest_type=$5,
       vehicle_interest=$6, status=$7, notes=$8, last_contact=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, email, phone, source, interest_type, vehicle_interest, status, notes, last_contact, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    await auditLog(req.user.id, 'lead_updated', { lead_id: req.params.id, status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    await auditLog(req.user.id, 'lead_deleted', { lead_id: req.params.id });
    res.json({ message: 'Lead deleted', lead: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/ai-score - AI Lead Scoring
router.post('/:id/ai-score', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const scoring = await scoreLead(result.rows[0]);

    if (scoring.score) {
      await pool.query('UPDATE leads SET ai_score = $1 WHERE id = $2', [scoring.score, req.params.id]);
    }

    await auditLog(req.user.id, 'lead_ai_scored', { lead_id: req.params.id, score: scoring.score, grade: scoring.grade });
    res.json(scoring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/assign - Auto-assign lead to salesperson with lowest active lead count
router.post('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (leadResult.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    // Find the salesperson (staff member with role salesperson/sales) with the fewest active assigned leads
    // Falls back to staff table if available, else uses distinct assigned_to values from leads
    let salesperson = null;

    try {
      // Try staff table first
      const staffResult = await pool.query(`
        SELECT s.id, s.name, s.email, COUNT(l.id) AS active_lead_count
        FROM staff s
        LEFT JOIN leads l ON l.assigned_to = s.id AND l.status NOT IN ('lost', 'converted')
        WHERE s.role ILIKE '%sales%' OR s.department ILIKE '%sales%'
        GROUP BY s.id, s.name, s.email
        ORDER BY active_lead_count ASC
        LIMIT 1
      `);
      if (staffResult.rows.length > 0) {
        salesperson = staffResult.rows[0];
      }
    } catch (_) {
      // staff table may not exist or have different schema
    }

    if (!salesperson) {
      // Allow manual assignment via body
      const { salesperson_id, salesperson_name } = req.body;
      if (!salesperson_id && !salesperson_name) {
        return res.status(422).json({ error: 'No eligible salesperson found. Provide salesperson_id or salesperson_name in body.' });
      }
      salesperson = { id: salesperson_id, name: salesperson_name };
    }

    const updated = await pool.query(
      `UPDATE leads SET assigned_to = $1, assigned_name = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [salesperson.id, salesperson.name || salesperson.email, req.params.id]
    );

    await auditLog(req.user.id, 'lead_assigned', {
      lead_id: req.params.id,
      assigned_to: salesperson.id,
      assigned_name: salesperson.name,
      active_lead_count: salesperson.active_lead_count,
    });

    res.json({ lead: updated.rows[0], assigned_to: salesperson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
