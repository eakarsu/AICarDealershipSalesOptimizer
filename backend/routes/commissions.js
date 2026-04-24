const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/commissions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cm.*,
        s.first_name || ' ' || s.last_name as staff_name,
        s.department
      FROM commissions cm
      LEFT JOIN staff s ON cm.staff_id = s.id
      ORDER BY cm.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commissions/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cm.*,
        s.first_name || ' ' || s.last_name as staff_name
      FROM commissions cm
      LEFT JOIN staff s ON cm.staff_id = s.id
      WHERE cm.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/commissions
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { staff_id, deal_id, commission_type, sale_amount, commission_rate, commission_amount, pay_period, status, notes } = req.body;
    const calculated_amount = commission_amount || (sale_amount * (commission_rate / 100));

    const result = await pool.query(
      `INSERT INTO commissions (staff_id, deal_id, commission_type, sale_amount, commission_rate, commission_amount, pay_period, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [staff_id, deal_id, commission_type || 'vehicle_sale', sale_amount, commission_rate, calculated_amount, pay_period, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/commissions/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { staff_id, deal_id, commission_type, sale_amount, commission_rate, commission_amount, pay_period, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE commissions SET staff_id=$1, deal_id=$2, commission_type=$3, sale_amount=$4, commission_rate=$5,
       commission_amount=$6, pay_period=$7, status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [staff_id, deal_id, commission_type, sale_amount, commission_rate, commission_amount, pay_period, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/commissions/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM commissions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Commission not found' });
    res.json({ message: 'Commission deleted', commission: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/commissions/summary/by-staff - Commission totals by staff
router.get('/summary/by-staff', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.first_name || ' ' || s.last_name as staff_name, s.department,
        COUNT(cm.id) as total_commissions,
        COALESCE(SUM(CASE WHEN cm.status = 'paid' THEN cm.commission_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN cm.status = 'pending' THEN cm.commission_amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(cm.commission_amount), 0) as total_earned
      FROM staff s
      LEFT JOIN commissions cm ON s.id = cm.staff_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.first_name, s.last_name, s.department
      ORDER BY total_earned DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
