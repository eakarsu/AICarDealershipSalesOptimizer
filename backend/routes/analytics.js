const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateAnalyticsInsights } = require('../services/openrouter');

// GET /api/analytics/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [inventory, customers, leads, deals, tradeIns, fniProducts, serviceAppts, inspections, testDrives, followups, campaigns, staffResult, commissionsResult, documentsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'available\') as available, AVG(listing_price) as avg_price, AVG(days_on_lot) as avg_days FROM inventory'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM customers'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'new\') as new_leads, AVG(ai_score) as avg_score FROM leads'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'completed\') as completed, SUM(total_deal_value) as total_revenue, AVG(profit_margin) as avg_margin FROM deals'),
      pool.query('SELECT COUNT(*) as total, AVG(ai_valuation) as avg_valuation FROM trade_ins'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM fni_products'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'scheduled\') as scheduled FROM service_appointments'),
      pool.query('SELECT COUNT(*) as total, AVG(overall_score) as avg_score FROM vehicle_inspections'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'scheduled\') as upcoming FROM test_drives'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'pending\') as pending FROM customer_followups'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM marketing_campaigns'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM staff'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'pending\') as pending FROM commissions'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM documents'),
    ]);

    const stats = {
      inventory: {
        total: parseInt(inventory.rows[0].total),
        available: parseInt(inventory.rows[0].available),
        avg_price: Math.round(parseFloat(inventory.rows[0].avg_price) || 0),
        avg_days_on_lot: Math.round(parseFloat(inventory.rows[0].avg_days) || 0),
      },
      customers: {
        total: parseInt(customers.rows[0].total),
        active: parseInt(customers.rows[0].active),
      },
      leads: {
        total: parseInt(leads.rows[0].total),
        new_leads: parseInt(leads.rows[0].new_leads),
        avg_score: Math.round(parseFloat(leads.rows[0].avg_score) || 0),
      },
      deals: {
        total: parseInt(deals.rows[0].total),
        completed: parseInt(deals.rows[0].completed),
        total_revenue: Math.round(parseFloat(deals.rows[0].total_revenue) || 0),
        avg_margin: parseFloat(parseFloat(deals.rows[0].avg_margin || 0).toFixed(2)),
      },
      trade_ins: {
        total: parseInt(tradeIns.rows[0].total),
        avg_valuation: Math.round(parseFloat(tradeIns.rows[0].avg_valuation) || 0),
      },
      fni_products: {
        total: parseInt(fniProducts.rows[0].total),
        active: parseInt(fniProducts.rows[0].active),
      },
      service_appointments: {
        total: parseInt(serviceAppts.rows[0].total),
        scheduled: parseInt(serviceAppts.rows[0].scheduled),
      },
      inspections: {
        total: parseInt(inspections.rows[0].total),
        avg_score: Math.round(parseFloat(inspections.rows[0].avg_score) || 0),
      },
      test_drives: {
        total: parseInt(testDrives.rows[0].total),
        upcoming: parseInt(testDrives.rows[0].upcoming),
      },
      followups: {
        total: parseInt(followups.rows[0].total),
        pending: parseInt(followups.rows[0].pending),
      },
      campaigns: {
        total: parseInt(campaigns.rows[0].total),
        active: parseInt(campaigns.rows[0].active),
      },
      staff: {
        total: parseInt(staffResult.rows[0].total),
        active: parseInt(staffResult.rows[0].active),
      },
      commissions: {
        total: parseInt(commissionsResult.rows[0].total),
        pending: parseInt(commissionsResult.rows[0].pending),
      },
      documents: {
        total: parseInt(documentsResult.rows[0].total),
        active: parseInt(documentsResult.rows[0].active),
      },
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics/ai-insights
router.post('/ai-insights', authenticateToken, async (req, res) => {
  try {
    const [inventory, deals, leads] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'available\') as available, AVG(listing_price) as avg_price, AVG(days_on_lot) as avg_days, SUM(listing_price) as total_inventory_value FROM inventory'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'completed\') as completed, SUM(total_deal_value) as revenue, AVG(profit_margin) as avg_margin, AVG(sale_price) as avg_sale FROM deals'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'new\') as new_count, COUNT(*) FILTER (WHERE status = \'contacted\') as contacted, AVG(ai_score) as avg_score FROM leads'),
    ]);

    const stats = {
      inventory_count: inventory.rows[0].total,
      available_vehicles: inventory.rows[0].available,
      avg_vehicle_price: `$${Math.round(inventory.rows[0].avg_price || 0).toLocaleString()}`,
      avg_days_on_lot: Math.round(inventory.rows[0].avg_days || 0),
      total_inventory_value: `$${Math.round(inventory.rows[0].total_inventory_value || 0).toLocaleString()}`,
      total_deals: deals.rows[0].total,
      completed_deals: deals.rows[0].completed,
      total_revenue: `$${Math.round(deals.rows[0].revenue || 0).toLocaleString()}`,
      avg_profit_margin: `${parseFloat(deals.rows[0].avg_margin || 0).toFixed(1)}%`,
      avg_sale_price: `$${Math.round(deals.rows[0].avg_sale || 0).toLocaleString()}`,
      total_leads: leads.rows[0].total,
      new_leads: leads.rows[0].new_count,
      contacted_leads: leads.rows[0].contacted,
      avg_lead_score: Math.round(leads.rows[0].avg_score || 0),
    };

    const insights = await generateAnalyticsInsights(stats);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
