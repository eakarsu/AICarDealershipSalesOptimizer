const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚗 AutoGenius API running on http://localhost:${PORT}\n`);
});
