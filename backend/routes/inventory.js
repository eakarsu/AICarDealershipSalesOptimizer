const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeInventoryPricing } = require('../services/openrouter');

// GET /api/inventory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition, body_type, status } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory (vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition, body_type, status, days_on_lot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, 0) RETURNING *`,
      [vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition || 'Good', body_type, status || 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition, body_type, status } = req.body;
    const result = await pool.query(
      `UPDATE inventory SET vin=$1, make=$2, model=$3, year=$4, trim=$5, color=$6, mileage=$7,
       purchase_price=$8, listing_price=$9, condition=$10, body_type=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [vin, make, model, year, trim, color, mileage, purchase_price, listing_price, condition, body_type, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted', vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/:id/ai-price - AI Pricing Analysis
router.post('/:id/ai-price', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const analysis = await analyzeInventoryPricing(result.rows[0]);

    if (analysis.recommended_price) {
      await pool.query('UPDATE inventory SET ai_suggested_price = $1 WHERE id = $2',
        [analysis.recommended_price, req.params.id]);
    }

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
