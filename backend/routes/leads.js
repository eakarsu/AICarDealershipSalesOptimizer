const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { scoreLead } = require('../services/openrouter');

// GET /api/leads
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(result.rows);
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_name, email, phone, source, interest_type, vehicle_interest, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (customer_name, email, phone, source, interest_type, vehicle_interest, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [customer_name, email, phone, source, interest_type, vehicle_interest, status || 'new', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leads/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_name, email, phone, source, interest_type, vehicle_interest, status, notes, last_contact } = req.body;
    const result = await pool.query(
      `UPDATE leads SET customer_name=$1, email=$2, phone=$3, source=$4, interest_type=$5,
       vehicle_interest=$6, status=$7, notes=$8, last_contact=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [customer_name, email, phone, source, interest_type, vehicle_interest, status, notes, last_contact, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
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
    res.json({ message: 'Lead deleted', lead: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/ai-score - AI Lead Scoring
router.post('/:id/ai-score', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const scoring = await scoreLead(result.rows[0]);

    if (scoring.score) {
      await pool.query('UPDATE leads SET ai_score = $1 WHERE id = $2', [scoring.score, req.params.id]);
    }

    res.json(scoring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
