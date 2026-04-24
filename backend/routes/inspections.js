const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeInspection } = require('../services/openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vi.*, i.year || ' ' || i.make || ' ' || i.model as vehicle_name
      FROM vehicle_inspections vi
      LEFT JOIN inventory i ON vi.vehicle_id = i.id
      ORDER BY vi.inspection_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vi.*, i.year || ' ' || i.make || ' ' || i.model as vehicle_name
      FROM vehicle_inspections vi
      LEFT JOIN inventory i ON vi.vehicle_id = i.id
      WHERE vi.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { vehicle_id, inspector_name, inspection_type, engine_rating, transmission_rating, brakes_rating, suspension_rating, tires_rating, exterior_rating, interior_rating, electrical_rating, overall_score, issues_found, reconditioning_cost, passed, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO vehicle_inspections (vehicle_id, inspector_name, inspection_type, engine_rating, transmission_rating, brakes_rating, suspension_rating, tires_rating, exterior_rating, interior_rating, electrical_rating, overall_score, issues_found, reconditioning_cost, passed, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [vehicle_id, inspector_name, inspection_type, engine_rating || 'Good', transmission_rating || 'Good', brakes_rating || 'Good', suspension_rating || 'Good', tires_rating || 'Good', exterior_rating || 'Good', interior_rating || 'Good', electrical_rating || 'Good', overall_score || 80, issues_found, reconditioning_cost || 0, passed !== false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { vehicle_id, inspector_name, inspection_type, engine_rating, transmission_rating, brakes_rating, suspension_rating, tires_rating, exterior_rating, interior_rating, electrical_rating, overall_score, issues_found, reconditioning_cost, passed, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE vehicle_inspections SET vehicle_id=$1, inspector_name=$2, inspection_type=$3, engine_rating=$4, transmission_rating=$5,
       brakes_rating=$6, suspension_rating=$7, tires_rating=$8, exterior_rating=$9, interior_rating=$10, electrical_rating=$11,
       overall_score=$12, issues_found=$13, reconditioning_cost=$14, passed=$15, notes=$16, status=$17, updated_at=NOW()
       WHERE id=$18 RETURNING *`,
      [vehicle_id, inspector_name, inspection_type, engine_rating, transmission_rating, brakes_rating, suspension_rating, tires_rating, exterior_rating, interior_rating, electrical_rating, overall_score, issues_found, reconditioning_cost, passed, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicle_inspections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    res.json({ message: 'Inspection deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicle_inspections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Inspection not found' });
    const analysis = await analyzeInspection(result.rows[0]);
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
