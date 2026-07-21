const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const { validateRuntime } = require('./config/runtime');

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
app.use('/api/trade-in-confidence', require('./routes/tradeInConfidence'));
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
app.use('/api/agentic-sdr', require('./routes/agenticSdr')); // apply pass 6 — audit custom suggestion

app.use('/api/manufacturer-specs-rag', require('./routes/manufacturerSpecsRag')); // apply pass 6 — audit custom suggestion

app.use('/api/competitor-pricing', require('./routes/competitorPricingStream')); // apply pass 6 — audit custom suggestion

app.use('/api/dealer-group', require('./routes/dealerGroupWhiteLabel')); // apply pass 6 — audit custom suggestion
app.use('/api/retail-lifecycle', require('./middleware/auth').authenticateToken, require('./routes/retailLifecycle'));
validateRuntime();
app.listen(PORT, () => {
  console.log(`\n🚗 AutoGenius API running on http://localhost:${PORT}\n`);
});



// Custom Dealer Views (2 viz + 2 non-viz) — mount BEFORE 404 handler
app.use('/api/custom-views', require('./routes/customViews'));

// 404 handler (must be after all routes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});
