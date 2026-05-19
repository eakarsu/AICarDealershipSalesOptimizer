const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../config/database');
const {
  analyzeTradeInPhoto,
  analyzeInventoryAging,
  optimizePayment,
  analyzeMarketDemand,
  buildCustomerPersona,
  analyzeWarrantyOpportunity,
  checkComplianceDocuments,
  coachSalesSkills,
} = require('../services/openrouter');

const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

async function persistResult(req, feature, input, output) {
  try {
    const userId = req.user?.id || null;
    await pool.query(
      'INSERT INTO ai_results (user_id, feature, input, output, model) VALUES ($1, $2, $3, $4, $5)',
      [userId, feature, input ? JSON.stringify(input) : null, output ? JSON.stringify(output) : null, MODEL]
    );
  } catch (e) {
    console.warn('[ai_results] persist failed:', e.message);
  }
}

// POST /api/ai/trade-in-photo-analysis
// Takes { vehicle_info, condition_description }
router.post(
  '/trade-in-photo-analysis',
  authenticateToken,
  aiRateLimiter,
  [
    body('vehicle_info').notEmpty().withMessage('vehicle_info is required'),
    body('condition_description').trim().notEmpty().withMessage('condition_description is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { vehicle_info, condition_description } = req.body;
      const result = await analyzeTradeInPhoto(vehicle_info, condition_description);
      await persistResult(req, 'trade-in-photo-analysis', { vehicle_info, condition_description }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/inventory-aging
// Takes { inventory[] }
router.post(
  '/inventory-aging',
  authenticateToken,
  aiRateLimiter,
  [
    body('inventory').isArray({ min: 1 }).withMessage('inventory must be a non-empty array'),
  ],
  validate,
  async (req, res) => {
    try {
      const { inventory } = req.body;
      const result = await analyzeInventoryAging(inventory);
      await persistResult(req, 'inventory-aging', { inventory }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/payment-optimizer
// Takes { credit_score, down_payment, vehicle_price }
router.post(
  '/payment-optimizer',
  authenticateToken,
  aiRateLimiter,
  [
    body('credit_score').isInt({ min: 300, max: 850 }).withMessage('credit_score must be between 300 and 850'),
    body('down_payment').isFloat({ min: 0 }).withMessage('down_payment must be a non-negative number'),
    body('vehicle_price').isFloat({ min: 1 }).withMessage('vehicle_price must be a positive number'),
  ],
  validate,
  async (req, res) => {
    try {
      const { credit_score, down_payment, vehicle_price } = req.body;
      const result = await optimizePayment(credit_score, down_payment, vehicle_price);
      await persistResult(req, 'payment-optimizer', { credit_score, down_payment, vehicle_price }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/market-demand
// Takes { models[], zip_code, season }
router.post(
  '/market-demand',
  authenticateToken,
  aiRateLimiter,
  [
    body('models').isArray({ min: 1 }).withMessage('models must be a non-empty array'),
    body('zip_code').trim().notEmpty().withMessage('zip_code is required'),
    body('season').trim().notEmpty().withMessage('season is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { models, zip_code, season } = req.body;
      const result = await analyzeMarketDemand(models, zip_code, season);
      await persistResult(req, 'market-demand', { models, zip_code, season }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/customer-persona
// Takes { customer, purchase_history? }
router.post(
  '/customer-persona',
  authenticateToken,
  aiRateLimiter,
  [
    body('customer').notEmpty().withMessage('customer is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { customer, purchase_history } = req.body;
      const result = await buildCustomerPersona(customer, purchase_history);
      await persistResult(req, 'customer-persona', { customer, purchase_history }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/warranty-analyzer
// Takes { vehicle, claims_history?, customer_profile? }
router.post(
  '/warranty-analyzer',
  authenticateToken,
  aiRateLimiter,
  [
    body('vehicle').notEmpty().withMessage('vehicle is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { vehicle, claims_history, customer_profile } = req.body;
      const result = await analyzeWarrantyOpportunity(vehicle, claims_history, customer_profile);
      await persistResult(req, 'warranty-analyzer', { vehicle, claims_history, customer_profile }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/compliance-checker
// Takes { trade_in, documents? }
router.post(
  '/compliance-checker',
  authenticateToken,
  aiRateLimiter,
  [
    body('trade_in').notEmpty().withMessage('trade_in is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { trade_in, documents } = req.body;
      const result = await checkComplianceDocuments(trade_in, documents);
      await persistResult(req, 'compliance-checker', { trade_in, documents }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/sales-coach
// Takes { rep_profile, recent_interactions[] }
router.post(
  '/sales-coach',
  authenticateToken,
  aiRateLimiter,
  [
    body('rep_profile').notEmpty().withMessage('rep_profile is required'),
    body('recent_interactions').isArray({ min: 1 }).withMessage('recent_interactions must be a non-empty array'),
  ],
  validate,
  async (req, res) => {
    try {
      const { rep_profile, recent_interactions } = req.body;
      const result = await coachSalesSkills(rep_profile, recent_interactions);
      await persistResult(req, 'sales-coach', { rep_profile, recent_interactions }, result);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/ai/results — paginated list of stored AI results (filterable by feature)
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const feature = req.query.feature ? String(req.query.feature) : null;

    const params = [];
    let where = '';
    if (feature) {
      params.push(feature);
      where = 'WHERE feature = $1';
    }

    const countSql = `SELECT COUNT(*)::int AS total FROM ai_results ${where}`;
    const countRes = await pool.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const limitIdx = dataParams.length - 1;
    const offsetIdx = dataParams.length;
    const dataSql = `SELECT id, user_id, feature, input, output, model, created_at
                     FROM ai_results ${where}
                     ORDER BY created_at DESC
                     LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const rows = await pool.query(dataSql, dataParams);

    res.json({
      data: rows.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error listing ai_results:', err);
    res.status(500).json({ error: 'Failed to list AI results.' });
  }
});

module.exports = router;
