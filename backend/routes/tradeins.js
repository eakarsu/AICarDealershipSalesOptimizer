const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { valuateTradeIn } = require('../services/openrouter');

// GET /api/trade-ins
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name
      FROM trade_ins t
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade-ins/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.first_name || ' ' || c.last_name as customer_name
      FROM trade_ins t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade-in not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade-ins
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, make, model, year, mileage, condition, photo_url, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO trade_ins (customer_id, make, model, year, mileage, condition, photo_url, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [customer_id, make, model, year, mileage, condition, photo_url, notes, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trade-ins/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, make, model, year, mileage, condition, photo_url, notes, status, market_value } = req.body;
    const result = await pool.query(
      `UPDATE trade_ins SET customer_id=$1, make=$2, model=$3, year=$4, mileage=$5, condition=$6,
       photo_url=$7, notes=$8, status=$9, market_value=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [customer_id, make, model, year, mileage, condition, photo_url, notes, status, market_value, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade-in not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trade-ins/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trade_ins WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade-in not found' });
    res.json({ message: 'Trade-in deleted', tradeIn: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade-ins/:id/ai-valuate - AI Trade-In Valuation
router.post('/:id/ai-valuate', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trade_ins WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade-in not found' });

    const valuation = await valuateTradeIn(result.rows[0]);

    if (valuation.estimated_value) {
      await pool.query('UPDATE trade_ins SET ai_valuation = $1 WHERE id = $2',
        [valuation.estimated_value, req.params.id]);
    }

    res.json(valuation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
