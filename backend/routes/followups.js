const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeFollowUp } = require('../services/openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_followups ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_followups WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, customer_name, contact_type, direction, subject, notes, outcome, sales_person, follow_up_date, sentiment, priority, status } = req.body;
    const result = await pool.query(
      `INSERT INTO customer_followups (customer_id, customer_name, contact_type, direction, subject, notes, outcome, sales_person, follow_up_date, sentiment, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [customer_id, customer_name, contact_type, direction || 'outbound', subject, notes, outcome, sales_person, follow_up_date, sentiment || 'Neutral', priority || 'Medium', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { customer_id, customer_name, contact_type, direction, subject, notes, outcome, sales_person, follow_up_date, sentiment, priority, status } = req.body;
    const result = await pool.query(
      `UPDATE customer_followups SET customer_id=$1, customer_name=$2, contact_type=$3, direction=$4, subject=$5,
       notes=$6, outcome=$7, sales_person=$8, follow_up_date=$9, sentiment=$10, priority=$11, status=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [customer_id, customer_name, contact_type, direction, subject, notes, outcome, sales_person, follow_up_date, sentiment, priority, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customer_followups WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    res.json({ message: 'Follow-up deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_followups WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Follow-up not found' });
    const analysis = await analyzeFollowUp(result.rows[0]);
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
