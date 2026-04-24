const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/reports/sales-summary - Sales summary report
router.get('/sales-summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'WHERE d.created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }

    const summary = await pool.query(`
      SELECT
        COUNT(*) as total_deals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_deals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_deals,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_deals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN sale_price ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN sale_price ELSE NULL END), 0) as avg_sale_price,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN profit_margin ELSE NULL END), 0) as avg_profit_margin,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN fni_total ELSE 0 END), 0) as total_fni_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN trade_in_value ELSE 0 END), 0) as total_trade_in_value
      FROM deals d ${dateFilter}
    `, params);

    const byPerson = await pool.query(`
      SELECT sales_person,
        COUNT(*) as deals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN sale_price ELSE 0 END), 0) as revenue
      FROM deals d ${dateFilter}
      GROUP BY sales_person
      ORDER BY revenue DESC
    `, params);

    res.json({
      summary: summary.rows[0],
      by_sales_person: byPerson.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/inventory-report - Inventory aging and status report
router.get('/inventory-report', authenticateToken, async (req, res) => {
  try {
    const statusBreakdown = await pool.query(`
      SELECT status, COUNT(*) as count,
        COALESCE(AVG(listing_price), 0) as avg_price,
        COALESCE(AVG(days_on_lot), 0) as avg_days_on_lot,
        COALESCE(SUM(listing_price), 0) as total_value
      FROM inventory
      GROUP BY status
    `);

    const aging = await pool.query(`
      SELECT
        SUM(CASE WHEN days_on_lot <= 30 THEN 1 ELSE 0 END) as under_30_days,
        SUM(CASE WHEN days_on_lot > 30 AND days_on_lot <= 60 THEN 1 ELSE 0 END) as days_31_60,
        SUM(CASE WHEN days_on_lot > 60 AND days_on_lot <= 90 THEN 1 ELSE 0 END) as days_61_90,
        SUM(CASE WHEN days_on_lot > 90 THEN 1 ELSE 0 END) as over_90_days
      FROM inventory WHERE status = 'available'
    `);

    const topMakes = await pool.query(`
      SELECT make, COUNT(*) as count, COALESCE(AVG(listing_price), 0) as avg_price
      FROM inventory
      GROUP BY make
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      status_breakdown: statusBreakdown.rows,
      aging: aging.rows[0],
      top_makes: topMakes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/customer-report - Customer activity report
router.get('/customer-report', authenticateToken, async (req, res) => {
  try {
    const overview = await pool.query(`
      SELECT
        COUNT(*) as total_customers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN financing_needed = true THEN 1 ELSE 0 END) as need_financing,
        COALESCE(AVG(budget_max), 0) as avg_budget
      FROM customers
    `);

    const byPreference = await pool.query(`
      SELECT preferred_make, COUNT(*) as count
      FROM customers
      WHERE preferred_make IS NOT NULL AND preferred_make != ''
      GROUP BY preferred_make
      ORDER BY count DESC
      LIMIT 10
    `);

    const recentDeals = await pool.query(`
      SELECT c.first_name || ' ' || c.last_name as customer_name,
        i.year || ' ' || i.make || ' ' || i.model as vehicle,
        d.sale_price, d.status, d.created_at
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN inventory i ON d.vehicle_id = i.id
      ORDER BY d.created_at DESC
      LIMIT 20
    `);

    res.json({
      overview: overview.rows[0],
      preferred_makes: byPreference.rows,
      recent_deals: recentDeals.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/lead-conversion - Lead conversion funnel report
router.get('/lead-conversion', authenticateToken, async (req, res) => {
  try {
    const funnel = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
      ORDER BY count DESC
    `);

    const bySource = await pool.query(`
      SELECT source, COUNT(*) as total,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        COALESCE(AVG(ai_score), 0) as avg_score
      FROM leads
      GROUP BY source
      ORDER BY total DESC
    `);

    res.json({
      funnel: funnel.rows,
      by_source: bySource.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/export/:type - Export data as CSV
router.get('/export/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    let result;

    switch (type) {
      case 'inventory':
        result = await pool.query('SELECT * FROM inventory ORDER BY created_at DESC');
        break;
      case 'customers':
        result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
        break;
      case 'deals':
        result = await pool.query(`
          SELECT d.*, c.first_name || ' ' || c.last_name as customer_name,
            i.year || ' ' || i.make || ' ' || i.model as vehicle
          FROM deals d
          LEFT JOIN customers c ON d.customer_id = c.id
          LEFT JOIN inventory i ON d.vehicle_id = i.id
          ORDER BY d.created_at DESC
        `);
        break;
      case 'leads':
        result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        break;
      case 'staff':
        result = await pool.query('SELECT * FROM staff ORDER BY created_at DESC');
        break;
      case 'commissions':
        result = await pool.query(`
          SELECT cm.*, s.first_name || ' ' || s.last_name as staff_name
          FROM commissions cm
          LEFT JOIN staff s ON cm.staff_id = s.id
          ORDER BY cm.created_at DESC
        `);
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
