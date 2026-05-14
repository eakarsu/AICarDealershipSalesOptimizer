/**
 * Apply pass 5 — backlog integrations (NEEDS-CREDS 503-stubs).
 *
 * Documented env vars:
 *   Notifications:
 *     SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM     (email)
 *     TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER  (SMS)
 *   Payments / Finance:
 *     STRIPE_SECRET_KEY                                          (Stripe)
 *   Dealer Management Systems:
 *     DEALERSOCKET_API_KEY, DEALERSOCKET_DEALER_ID               (DealerSocket)
 *     REYNOLDS_API_KEY, REYNOLDS_DEALER_ID                       (Reynolds & Reynolds ERA)
 *   Inventory feeds:
 *     AUTOTRADER_API_KEY, AUTOTRADER_DEALER_ID                   (AutoTrader)
 *
 * No outbound HTTP fired unless env var set. Additive only.
 */
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

(async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        channel VARCHAR(32) NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        status VARCHAR(32) DEFAULT 'queued_stub',
        provider_response TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notif_user ON notification_log(user_id);
    `);
  } catch (_) {}
})();

function missingEnv(...keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}

function need(envs, label, res) {
  const miss = missingEnv(...envs);
  if (miss.length) {
    res.status(503).json({ error: `${label} not configured`, missing: miss });
    return false;
  }
  return true;
}

// ---------------------- Notifications ----------------------
router.post('/notifications/email', async (req, res) => {
  if (!need(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'], 'SMTP email', res)) return;
  const { to, subject, body } = req.body || {};
  if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });
  try {
    await pool.query(
      `INSERT INTO notification_log (user_id, channel, recipient, subject, body, status)
       VALUES ($1, 'email', $2, $3, $4, 'queued_stub')`,
      [req.user?.id || null, to, subject, body || '']
    );
  } catch (_) {}
  res.json({ status: 'queued', provider: 'smtp', note: 'stub — outbound delivery requires nodemailer dep' });
});

router.post('/notifications/sms', async (req, res) => {
  if (!need(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'], 'Twilio SMS', res)) return;
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to and body required' });
  try {
    await pool.query(
      `INSERT INTO notification_log (user_id, channel, recipient, body, status)
       VALUES ($1, 'sms', $2, $3, 'queued_stub')`,
      [req.user?.id || null, to, body]
    );
  } catch (_) {}
  res.json({ status: 'queued', provider: 'twilio', note: 'stub — outbound requires twilio dep' });
});

router.get('/notifications/log', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, channel, recipient, subject, status, created_at
       FROM notification_log WHERE user_id = $1
       ORDER BY id DESC LIMIT 50`,
      [req.user?.id || null]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'failed', details: err.message }); }
});

// ---------------------- Stripe ----------------------
router.post('/stripe/charge', (req, res) => {
  if (!need(['STRIPE_SECRET_KEY'], 'Stripe', res)) return;
  const { amount, currency, deal_id } = req.body || {};
  if (!amount || !currency) return res.status(400).json({ error: 'amount and currency required' });
  res.json({ status: 'queued', provider: 'stripe', amount, currency, deal_id: deal_id || null, note: 'stub — wire stripe SDK when ready' });
});

// ---------------------- Dealer Management Systems ----------------------
router.get('/dms/dealersocket/leads', (req, res) => {
  if (!need(['DEALERSOCKET_API_KEY', 'DEALERSOCKET_DEALER_ID'], 'DealerSocket', res)) return;
  res.json({ provider: 'dealersocket', leads: [], note: 'stub — wire to DealerSocket Open API when ready' });
});

router.get('/dms/reynolds/inventory', (req, res) => {
  if (!need(['REYNOLDS_API_KEY', 'REYNOLDS_DEALER_ID'], 'Reynolds & Reynolds', res)) return;
  res.json({ provider: 'reynolds', inventory: [], note: 'stub — wire to Reynolds ERA-IGNITE API when ready' });
});

router.get('/inventory/autotrader/feed', (req, res) => {
  if (!need(['AUTOTRADER_API_KEY', 'AUTOTRADER_DEALER_ID'], 'AutoTrader', res)) return;
  res.json({ provider: 'autotrader', listings: [], note: 'stub — wire to AutoTrader Inventory API when ready' });
});

module.exports = router;
