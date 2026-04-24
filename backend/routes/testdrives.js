const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeTestDrive } = require('../services/openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM test_drives ORDER BY scheduled_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM test_drives WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test drive not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes, sales_person, route_type, license_verified, insurance_verified, pre_drive_interest, post_drive_interest, feedback, outcome, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO test_drives (customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes, sales_person, route_type, license_verified, insurance_verified, pre_drive_interest, post_drive_interest, feedback, outcome, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes || 30, sales_person, route_type || 'Mixed', license_verified || false, insurance_verified || false, pre_drive_interest, post_drive_interest, feedback, outcome || 'pending', notes, status || 'scheduled']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes, sales_person, route_type, license_verified, insurance_verified, pre_drive_interest, post_drive_interest, feedback, outcome, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE test_drives SET customer_id=$1, vehicle_id=$2, customer_name=$3, vehicle_description=$4, scheduled_date=$5,
       duration_minutes=$6, sales_person=$7, route_type=$8, license_verified=$9, insurance_verified=$10,
       pre_drive_interest=$11, post_drive_interest=$12, feedback=$13, outcome=$14, notes=$15, status=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [customer_id, vehicle_id, customer_name, vehicle_description, scheduled_date, duration_minutes, sales_person, route_type, license_verified, insurance_verified, pre_drive_interest, post_drive_interest, feedback, outcome, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test drive not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM test_drives WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test drive not found' });
    res.json({ message: 'Test drive deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM test_drives WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test drive not found' });
    const analysis = await analyzeTestDrive(result.rows[0]);
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
