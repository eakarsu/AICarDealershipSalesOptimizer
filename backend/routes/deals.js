const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { analyzeDeal } = require('../services/openrouter');

// Audit log helper
async function auditLog(userId, action, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())`,
      [userId, action, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Validation rules
const dealValidation = [
  body('customer_id').notEmpty().isInt().withMessage('customer_id must be a valid integer'),
  body('vehicle_id').notEmpty().isInt().withMessage('vehicle_id must be a valid integer'),
  body('sale_price').notEmpty().isFloat({ min: 0 }).withMessage('sale_price must be a positive number'),
  body('status').optional().isIn(['pending', 'approved', 'funded', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('sales_person').optional().trim(),
];

// GET /api/deals - with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM deals');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT d.*,
        c.first_name || ' ' || c.last_name as customer_name,
        i.year || ' ' || i.make || ' ' || i.model as vehicle_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN inventory i ON d.vehicle_id = i.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      data: result.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deals/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
        c.first_name || ' ' || c.last_name as customer_name,
        i.year || ' ' || i.make || ' ' || i.model as vehicle_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN inventory i ON d.vehicle_id = i.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deals
router.post('/', authenticateToken, dealValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value, fni_total, status, sales_person } = req.body;
    const total_deal_value = (sale_price || 0) - (trade_in_value || 0) + (fni_total || 0);

    const vehicleResult = await pool.query('SELECT purchase_price FROM inventory WHERE id = $1', [vehicle_id]);
    const purchase_price = vehicleResult.rows[0]?.purchase_price || 0;
    const profit_margin = sale_price ? ((sale_price - purchase_price) / sale_price * 100).toFixed(2) : 0;

    const result = await pool.query(
      `INSERT INTO deals (customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value, fni_total, total_deal_value, profit_margin, status, sales_person)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value || 0, fni_total || 0, total_deal_value, profit_margin, status || 'pending', sales_person]
    );
    await auditLog(req.user.id, 'deal_created', { deal_id: result.rows[0].id, customer_id, vehicle_id, sale_price });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/deals/:id
router.put('/:id', authenticateToken, dealValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const { customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value, fni_total, status, sales_person } = req.body;
    const total_deal_value = (sale_price || 0) - (trade_in_value || 0) + (fni_total || 0);

    const result = await pool.query(
      `UPDATE deals SET customer_id=$1, vehicle_id=$2, trade_in_id=$3, sale_price=$4, trade_in_value=$5,
       fni_total=$6, total_deal_value=$7, status=$8, sales_person=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_id, vehicle_id, trade_in_id, sale_price, trade_in_value, fni_total, total_deal_value, status, sales_person, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    await auditLog(req.user.id, 'deal_updated', { deal_id: req.params.id, status, sale_price });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/deals/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM deals WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    await auditLog(req.user.id, 'deal_deleted', { deal_id: req.params.id });
    res.json({ message: 'Deal deleted', deal: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deals/:id/ai-analyze - AI Deal Analysis
router.post('/:id/ai-analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const dealResult = await pool.query('SELECT * FROM deals WHERE id = $1', [req.params.id]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    const deal = dealResult.rows[0];
    const vehicleResult = await pool.query('SELECT * FROM inventory WHERE id = $1', [deal.vehicle_id]);
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [deal.customer_id]);

    const analysis = await analyzeDeal(deal, vehicleResult.rows[0], customerResult.rows[0]);
    await auditLog(req.user.id, 'deal_ai_analyzed', { deal_id: req.params.id, deal_rating: analysis.deal_rating });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
