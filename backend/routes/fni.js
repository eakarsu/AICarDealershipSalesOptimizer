const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { recommendFniProducts } = require('../services/openrouter');

// GET /api/fni-products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fni_products ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fni-products/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fni_products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fni-products
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, base_price, commission_rate, provider, coverage_term, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO fni_products (name, description, category, base_price, commission_rate, provider, coverage_term, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description, category, base_price, commission_rate, provider, coverage_term, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fni-products/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, category, base_price, commission_rate, provider, coverage_term, is_active } = req.body;
    const result = await pool.query(
      `UPDATE fni_products SET name=$1, description=$2, category=$3, base_price=$4, commission_rate=$5,
       provider=$6, coverage_term=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, description, category, base_price, commission_rate, provider, coverage_term, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fni-products/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fni_products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fni-products/ai-recommend - AI F&I Recommendations
router.post('/ai-recommend', authenticateToken, async (req, res) => {
  try {
    const { customer_id, deal_id } = req.body;

    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]);
    if (customerResult.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

    let deal = { sale_price: 0, trade_in_value: 0 };
    if (deal_id) {
      const dealResult = await pool.query('SELECT * FROM deals WHERE id = $1', [deal_id]);
      if (dealResult.rows.length > 0) deal = dealResult.rows[0];
    }

    const productsResult = await pool.query("SELECT * FROM fni_products WHERE is_active = true");

    const recommendations = await recommendFniProducts(customerResult.rows[0], deal, productsResult.rows);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
