/**
 * Apply pass 5 — mechanical (deterministic) helper.
 *
 * Computes a sales-pipeline funnel snapshot from the existing leads + deals
 * tables. No AI, no external calls; reads only — additive.
 *
 * GET /api/pipeline/funnel
 *   → { stages: [{ stage, count, value_total }], conversion_rates,
 *       updated_at }
 *
 * Defensive: schema field names are detected by COALESCE; missing tables
 * return empty stages rather than 500.
 */
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

router.get('/funnel', async (req, res) => {
  const stages = [];
  // Leads
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM leads`);
    stages.push({ stage: 'leads', count: rows[0]?.c || 0, value_total: null });
  } catch (_) { stages.push({ stage: 'leads', count: 0, value_total: null, note: 'leads table missing' }); }
  // Test drives
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM test_drives`);
    stages.push({ stage: 'test_drives', count: rows[0]?.c || 0, value_total: null });
  } catch (_) { stages.push({ stage: 'test_drives', count: 0, value_total: null, note: 'test_drives table missing' }); }
  // Deals open
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(COALESCE(sale_price, total_price, amount, 0)), 0)::float AS v
       FROM deals WHERE COALESCE(status, '') IN ('open', 'pending', 'in_progress')`
    );
    stages.push({ stage: 'deals_open', count: rows[0]?.c || 0, value_total: rows[0]?.v || 0 });
  } catch (_) { stages.push({ stage: 'deals_open', count: 0, value_total: 0, note: 'deals table missing or schema differs' }); }
  // Deals won
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(COALESCE(sale_price, total_price, amount, 0)), 0)::float AS v
       FROM deals WHERE COALESCE(status, '') IN ('won', 'closed_won', 'completed', 'closed')`
    );
    stages.push({ stage: 'deals_won', count: rows[0]?.c || 0, value_total: rows[0]?.v || 0 });
  } catch (_) { stages.push({ stage: 'deals_won', count: 0, value_total: 0, note: 'deals table missing or schema differs' }); }

  // Conversion rates between adjacent stages.
  const conv = {};
  for (let i = 1; i < stages.length; i++) {
    const a = stages[i - 1].count;
    const b = stages[i].count;
    conv[`${stages[i - 1].stage}_to_${stages[i].stage}`] = a > 0 ? Number((b / a).toFixed(4)) : null;
  }

  res.json({ stages, conversion_rates: conv, updated_at: new Date().toISOString() });
});

module.exports = router;
