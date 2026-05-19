const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

const ALLOWED_EVENTS = [
  'lead.created', 'lead.qualified', 'deal.opened', 'deal.closed_won', 'deal.closed_lost',
  'test_drive.scheduled', 'service_appointment.scheduled',
  'inventory.added', 'inventory.sold', 'commission.calculated', 'campaign.launched'
];

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      url TEXT NOT NULL,
      events TEXT[] NOT NULL DEFAULT ARRAY['deal.closed_won']::text[],
      secret VARCHAR(255),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id)`).catch(() => {});
}
ensureTable();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, url, events, active, created_at, updated_at FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user?.id || null]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list webhooks', details: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { url, events, secret } = req.body || {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url is required' });
    try { new URL(url); } catch (_) { return res.status(400).json({ error: 'url must be a valid URL' }); }

    const incoming = Array.isArray(events) && events.length > 0 ? events : ['deal.closed_won'];
    const filtered = incoming.filter(e => ALLOWED_EVENTS.includes(e));
    if (filtered.length === 0) return res.status(400).json({ error: 'no valid events provided', allowed: ALLOWED_EVENTS });

    const r = await pool.query(
      `INSERT INTO webhooks (user_id, url, events, secret) VALUES ($1, $2, $3, $4)
       RETURNING id, url, events, active, created_at`,
      [req.user?.id || null, url, filtered, secret || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create webhook', details: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user?.id || null]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json({ success: true, deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Failed to delete webhook', details: err.message }); }
});

router.post('/:id/test', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, url, events FROM webhooks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user?.id || null]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Webhook not found' });
    const wh = r.rows[0];
    const payload = {
      event: 'webhook.test',
      delivery_id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from AICarDealershipSalesOptimizer' }
    };
    res.json({ success: true, target: wh.url, events: wh.events, payload, note: 'Stub: payload generated, no outgoing HTTP call performed.' });
  } catch (err) { res.status(500).json({ error: 'Failed to test webhook', details: err.message }); }
});

router.get('/_/events', (req, res) => res.json({ events: ALLOWED_EVENTS }));

module.exports = router;
