const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/staff
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, role, department, hire_date, salary, commission_rate, status } = req.body;
    const result = await pool.query(
      `INSERT INTO staff (first_name, last_name, email, phone, role, department, hire_date, salary, commission_rate, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [first_name, last_name, email, phone, role || 'sales', department || 'Sales', hire_date, salary, commission_rate || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, role, department, hire_date, salary, commission_rate, status } = req.body;
    const result = await pool.query(
      `UPDATE staff SET first_name=$1, last_name=$2, email=$3, phone=$4, role=$5, department=$6,
       hire_date=$7, salary=$8, commission_rate=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [first_name, last_name, email, phone, role, department, hire_date, salary, commission_rate, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ message: 'Staff member deleted', staff: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/staff/:id/performance - Get staff performance stats
router.get('/:id/performance', authenticateToken, async (req, res) => {
  try {
    const staff = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (staff.rows.length === 0) return res.status(404).json({ error: 'Staff member not found' });

    const staffName = `${staff.rows[0].first_name} ${staff.rows[0].last_name}`;

    const deals = await pool.query(
      `SELECT COUNT(*) as total_deals,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_deals,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN total_deal_value ELSE 0 END), 0) as total_revenue,
       COALESCE(AVG(CASE WHEN status = 'completed' THEN profit_margin ELSE NULL END), 0) as avg_margin
       FROM deals WHERE sales_person = $1`,
      [staffName]
    );

    const testDrives = await pool.query(
      'SELECT COUNT(*) as total FROM test_drives WHERE sales_person = $1',
      [staffName]
    );

    res.json({
      staff: staff.rows[0],
      performance: {
        ...deals.rows[0],
        test_drives: parseInt(testDrives.rows[0].total)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
