const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { matchCustomerToVehicles } = require('../services/openrouter');

// GET /api/customers - with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM customers');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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

// GET /api/customers/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed, status } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed || false, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed, status } = req.body;
    const result = await pool.query(
      `UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, budget_min=$5, budget_max=$6,
       preferred_make=$7, preferred_type=$8, credit_score_range=$9, financing_needed=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [first_name, last_name, email, phone, budget_min, budget_max, preferred_make, preferred_type, credit_score_range, financing_needed, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted', customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/ai-match - AI Vehicle Matching
router.post('/:id/ai-match', authenticateToken, async (req, res) => {
  try {
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (customerResult.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

    const vehiclesResult = await pool.query("SELECT * FROM inventory WHERE status = 'available' ORDER BY listing_price");

    const analysis = await matchCustomerToVehicles(customerResult.rows[0], vehiclesResult.rows);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
