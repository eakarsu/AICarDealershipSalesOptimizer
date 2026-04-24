const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { analyzeCampaign } = require('../services/openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marketing_campaigns ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marketing_campaigns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, campaign_type, channel, target_audience, start_date, end_date, budget, spent, leads_generated, deals_closed, revenue_attributed, impressions, clicks, conversion_rate, status, notes } = req.body;
    const roi = spent > 0 ? (((revenue_attributed || 0) - (spent || 0)) / (spent || 1) * 100).toFixed(2) : 0;
    const result = await pool.query(
      `INSERT INTO marketing_campaigns (name, campaign_type, channel, target_audience, start_date, end_date, budget, spent, leads_generated, deals_closed, revenue_attributed, impressions, clicks, conversion_rate, roi, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, campaign_type, channel, target_audience, start_date, end_date, budget || 0, spent || 0, leads_generated || 0, deals_closed || 0, revenue_attributed || 0, impressions || 0, clicks || 0, conversion_rate || 0, roi, status || 'draft', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, campaign_type, channel, target_audience, start_date, end_date, budget, spent, leads_generated, deals_closed, revenue_attributed, impressions, clicks, conversion_rate, status, notes } = req.body;
    const roi = spent > 0 ? (((revenue_attributed || 0) - (spent || 0)) / (spent || 1) * 100).toFixed(2) : 0;
    const result = await pool.query(
      `UPDATE marketing_campaigns SET name=$1, campaign_type=$2, channel=$3, target_audience=$4, start_date=$5,
       end_date=$6, budget=$7, spent=$8, leads_generated=$9, deals_closed=$10, revenue_attributed=$11,
       impressions=$12, clicks=$13, conversion_rate=$14, roi=$15, status=$16, notes=$17, updated_at=NOW()
       WHERE id=$18 RETURNING *`,
      [name, campaign_type, channel, target_audience, start_date, end_date, budget, spent, leads_generated, deals_closed, revenue_attributed, impressions, clicks, conversion_rate, roi, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM marketing_campaigns WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marketing_campaigns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    const analysis = await analyzeCampaign(result.rows[0]);
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
