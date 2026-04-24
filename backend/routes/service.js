const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeServiceNeeds } = require('../services/openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.first_name || ' ' || c.last_name as customer_name
      FROM service_appointments s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.scheduled_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.first_name || ' ' || c.last_name as customer_name
      FROM service_appointments s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, vehicle_description, service_type, scheduled_date, estimated_duration, assigned_technician, mileage_at_service, description, parts_cost, labor_cost, status } = req.body;
    const total_cost = (parseFloat(parts_cost) || 0) + (parseFloat(labor_cost) || 0);
    const result = await pool.query(
      `INSERT INTO service_appointments (customer_id, vehicle_description, service_type, scheduled_date, estimated_duration, assigned_technician, mileage_at_service, description, parts_cost, labor_cost, total_cost, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [customer_id, vehicle_description, service_type, scheduled_date, estimated_duration || 60, assigned_technician, mileage_at_service, description, parts_cost || 0, labor_cost || 0, total_cost, status || 'scheduled']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, vehicle_description, service_type, scheduled_date, estimated_duration, assigned_technician, mileage_at_service, description, parts_cost, labor_cost, status } = req.body;
    const total_cost = (parseFloat(parts_cost) || 0) + (parseFloat(labor_cost) || 0);
    const result = await pool.query(
      `UPDATE service_appointments SET customer_id=$1, vehicle_description=$2, service_type=$3, scheduled_date=$4,
       estimated_duration=$5, assigned_technician=$6, mileage_at_service=$7, description=$8,
       parts_cost=$9, labor_cost=$10, total_cost=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [customer_id, vehicle_description, service_type, scheduled_date, estimated_duration, assigned_technician, mileage_at_service, description, parts_cost, labor_cost, total_cost, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM service_appointments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_appointments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    const analysis = await analyzeServiceNeeds(result.rows[0]);
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
