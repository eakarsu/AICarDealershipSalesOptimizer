const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dealership_settings ORDER BY category, setting_key');
    const settings = {};
    result.rows.forEach(row => {
      if (!settings[row.category]) settings[row.category] = {};
      settings[row.category][row.setting_key] = {
        id: row.id,
        value: row.setting_value,
        label: row.label,
        type: row.value_type
      };
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/flat - Flat list of all settings
router.get('/flat', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dealership_settings ORDER BY category, setting_key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { setting_value } = req.body;
    const result = await pool.query(
      'UPDATE dealership_settings SET setting_value = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [setting_value, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setting not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/bulk - Update multiple settings at once
router.put('/bulk/update', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const updated = [];

    for (const { id, setting_value } of settings) {
      const result = await pool.query(
        'UPDATE dealership_settings SET setting_value = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [setting_value, id]
      );
      if (result.rows[0]) updated.push(result.rows[0]);
    }

    res.json({ updated: updated.length, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
