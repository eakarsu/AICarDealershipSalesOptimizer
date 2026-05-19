const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { analyzeInventoryPricing } = require('../services/openrouter');

// GET /api/inventory - with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM inventory');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM inventory ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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
router.post('/:id/ai-price', authenticateToken, aiRateLimiter, async (req, res) => {
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

// PUT /api/inventory/:id/reserve - Mark vehicle as reserved for a customer
router.put('/:id/reserve', authenticateToken, async (req, res) => {
  try {
    const { customer_id, customer_name, notes } = req.body;
    const result = await pool.query(
      `UPDATE inventory
       SET status = 'reserved',
           reserved_for_customer_id = $1,
           reserved_for_customer_name = $2,
           reserved_at = NOW(),
           reservation_notes = $3,
           updated_at = NOW()
       WHERE id = $4 AND status != 'sold'
       RETURNING *`,
      [customer_id || null, customer_name || null, notes || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found or already sold' });
    }
    res.json({ message: 'Vehicle reserved', vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:id/release - Release reservation/hold
router.put('/:id/release', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE inventory
       SET status = 'available',
           reserved_for_customer_id = NULL,
           reserved_for_customer_name = NULL,
           reserved_at = NULL,
           reservation_notes = NULL,
           updated_at = NOW()
       WHERE id = $1 AND status = 'reserved'
       RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found or not currently reserved' });
    }
    res.json({ message: 'Vehicle hold released', vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
