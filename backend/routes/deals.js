const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeDeal } = require('../services/openrouter');

// GET /api/deals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*,
        c.first_name || ' ' || c.last_name as customer_name,
        i.year || ' ' || i.make || ' ' || i.model as vehicle_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN inventory i ON d.vehicle_id = i.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
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
router.post('/', authenticateToken, async (req, res) => {
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/deals/:id
router.put('/:id', authenticateToken, async (req, res) => {
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
    res.json({ message: 'Deal deleted', deal: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deals/:id/ai-analyze - AI Deal Analysis
router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const dealResult = await pool.query('SELECT * FROM deals WHERE id = $1', [req.params.id]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    const deal = dealResult.rows[0];
    const vehicleResult = await pool.query('SELECT * FROM inventory WHERE id = $1', [deal.vehicle_id]);
    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [deal.customer_id]);

    const analysis = await analyzeDeal(deal, vehicleResult.rows[0], customerResult.rows[0]);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
