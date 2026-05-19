const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/trade-ins', require('./routes/tradeins'));
app.use('/api/fni-products', require('./routes/fni'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/service-appointments', require('./routes/service'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/test-drives', require('./routes/testdrives'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/commissions', require('./routes/commissions'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/ai', require('./routes/aiNew'));
app.use('/api/webhooks', require('./routes/webhooks'));
// Apply pass 5 — backlog (notifications, DMS integrations, pipeline stats)
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/pipeline', require('./routes/pipelineStats'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ensure ai_results table exists (idempotent)
const pool = require('./config/database');
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    feature VARCHAR(100) NOT NULL,
    input JSONB,
    output JSONB,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_ai_results_feature ON ai_results(feature);
  CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_results_created ON ai_results(created_at DESC);
`).catch((e) => console.warn('[ai_results] init warning:', e.message));


app.use('/api/agentic-sdr', require('./routes/agenticSdr')); // apply pass 6 — audit custom suggestion

app.use('/api/manufacturer-specs-rag', require('./routes/manufacturerSpecsRag')); // apply pass 6 — audit custom suggestion

app.use('/api/competitor-pricing', require('./routes/competitorPricingStream')); // apply pass 6 — audit custom suggestion

app.use('/api/dealer-group', require('./routes/dealerGroupWhiteLabel')); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
  console.log(`\n🚗 AutoGenius API running on http://localhost:${PORT}\n`);
});


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-ainew-js-scaffold-but-no-mounted-chat-style-ai-end', require('./routes/gap_ainew_js_scaffold_but_no_mounted_chat_style_ai_end'));
app.use('/api/gap-no-ai-lead-scoring-on-inbound-contacts', require('./routes/gap_no_ai_lead_scoring_on_inbound_contacts'));
app.use('/api/gap-no-ai-vehicle-photo-enhancement-and-listing-copy', require('./routes/gap_no_ai_vehicle_photo_enhancement_and_listing_copy'));
app.use('/api/gap-no-ai-trade-in-valuation', require('./routes/gap_no_ai_trade_in_valuation'));
app.use('/api/gap-no-ai-deal-desk-negotiation-co-pilot', require('./routes/gap_no_ai_deal_desk_negotiation_co_pilot'));
app.use('/api/gap-no-notification-system-sms-email-delivery-channel', require('./routes/gap_no_notification_system_sms_email_delivery_channel'));
app.use('/api/gap-no-direct-dms-api-clients-cdk-reynolds-reynolds-be', require('./routes/gap_no_direct_dms_api_clients_cdk_reynolds_reynolds_be'));
app.use('/api/gap-no-e-signature-f-i-document-execution-flow', require('./routes/gap_no_e_signature_f_i_document_execution_flow'));
app.use('/api/gap-no-vehicle-history-carfax-autocheck-integration', require('./routes/gap_no_vehicle_history_carfax_autocheck_integration'));
app.use('/api/gap-no-website-widget-for-self-serve-inventory-browsin', require('./routes/gap_no_website_widget_for_self_serve_inventory_browsin'));

// Custom Dealer Views (2 viz + 2 non-viz) — mount BEFORE 404 handler
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler (must be after all routes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});
