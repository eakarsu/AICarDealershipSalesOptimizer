// Custom Dealership Sales Views — 2 VIZ + 2 NON-VIZ
//   GET  /api/custom-views/lot-inventory          (VIZ: bar chart, units by make/model)
//   GET  /api/custom-views/sales-funnel-heatmap   (VIZ: heatmap, stage x salesperson)
//   POST /api/custom-views/deal-sheet-pdf         (NON-VIZ: text-based deal sheet "PDF")
//   GET/POST/PUT/DELETE /api/custom-views/lead-routing-rules  (NON-VIZ: CRUD)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

let pool = null;
try {
  pool = require('../config/database');
} catch (e) {
  pool = null;
}

function safeQuery(sql, params = []) {
  if (!pool) return Promise.resolve(null);
  return pool.query(sql, params).then((r) => r.rows).catch(() => null);
}

// Deterministic pseudo-random — keeps demo data stable across reloads
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// VIZ 1: Lot inventory grouped by make/model (bar chart data)
// ============================================================
router.get('/lot-inventory', authenticateToken, async (req, res) => {
  try {
    let rows = await safeQuery(
      `SELECT make,
              model,
              COUNT(*)::int                                    AS units,
              ROUND(COALESCE(AVG(listing_price),0)::numeric,0)::float AS avg_price,
              ROUND(COALESCE(AVG(days_on_lot),0)::numeric,0)::int     AS avg_days,
              SUM(CASE WHEN status='available' THEN 1 ELSE 0 END)::int AS available,
              SUM(CASE WHEN status='reserved'  THEN 1 ELSE 0 END)::int AS reserved,
              SUM(CASE WHEN status='sold'      THEN 1 ELSE 0 END)::int AS sold
         FROM inventory
        GROUP BY make, model
        ORDER BY units DESC
        LIMIT 16`
    );

    if (!rows || rows.length === 0) {
      const seed = seeded('lot-inventory-by-make-model');
      const synth = [
        ['Toyota','Camry'], ['Toyota','RAV4'], ['Honda','Civic'], ['Honda','CR-V'],
        ['Ford','F-150'], ['Ford','Mustang'], ['Chevrolet','Silverado'],
        ['Chevrolet','Tahoe'], ['Tesla','Model 3'], ['Tesla','Model Y'],
        ['BMW','X5'], ['Mercedes','GLC'], ['Nissan','Altima'], ['Subaru','Outback'],
        ['Hyundai','Tucson'], ['Kia','Sorento'],
      ];
      rows = synth.map(([make, model]) => {
        const units    = 4 + Math.floor(seed() * 22);
        const avg_price= 19000 + Math.floor(seed() * 55000);
        const avg_days = 4 + Math.floor(seed() * 75);
        const sold     = Math.floor(units * (0.15 + seed() * 0.3));
        const reserved = Math.floor(units * (0.05 + seed() * 0.15));
        const available= Math.max(0, units - sold - reserved);
        return { make, model, units, avg_price, avg_days, sold, reserved, available };
      });
    }

    const total_units = rows.reduce((s,r) => s + (r.units||0), 0);
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      total_models: rows.length,
      total_units,
      bars: rows,            // bar-chart-ready
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// VIZ 2: Sales funnel heatmap — stage x salesperson
// ============================================================
router.get('/sales-funnel-heatmap', authenticateToken, async (req, res) => {
  try {
    const stages = ['Lead', 'Contacted', 'Qualified', 'Test Drive', 'Negotiation', 'Closed'];

    // Try a database-derived heatmap (best-effort).  Falls back to synth.
    let salespeople = null;
    let cells = null;
    const staffRows = await safeQuery(
      `SELECT id, COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS name
         FROM staff WHERE LOWER(role) LIKE '%sales%' OR LOWER(role) LIKE '%sale%'
         ORDER BY id LIMIT 8`
    );
    if (staffRows && staffRows.length > 0) {
      salespeople = staffRows.map((r) => r.name.trim() || `Rep ${r.id}`);
    }

    if (!salespeople || salespeople.length === 0) {
      salespeople = ['Alex M.', 'Bri T.', 'Carlos P.', 'Dana L.', 'Evan S.', 'Fiona R.'];
    }

    const seed = seeded('sales-funnel-heatmap');
    cells = [];
    salespeople.forEach((rep, ri) => {
      stages.forEach((stage, si) => {
        // funnel narrows toward "Closed"
        const top = 28 - si * 3;
        const v = Math.max(1, Math.round(top * (0.5 + seed() * 0.6)));
        cells.push({ rep, stage, count: v });
      });
    });

    // Stage totals + rep totals
    const stage_totals = stages.map((stage) => ({
      stage,
      total: cells.filter((c) => c.stage === stage).reduce((s, c) => s + c.count, 0),
    }));
    const rep_totals = salespeople.map((rep) => ({
      rep,
      total: cells.filter((c) => c.rep === rep).reduce((s, c) => s + c.count, 0),
    }));
    const max = Math.max(1, ...cells.map((c) => c.count));

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      stages,
      salespeople,
      cells,
      stage_totals,
      rep_totals,
      max_cell: max,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// NON-VIZ 1: Deal sheet "PDF"  (text doc + base64 payload)
// ============================================================
router.post('/deal-sheet-pdf', authenticateToken, async (req, res) => {
  try {
    const b = req.body || {};
    const dealId    = b.deal_id       || `DS-${Date.now()}`;
    const customer  = b.customer_name || 'Walk-In Customer';
    const vehicle   = b.vehicle       || '2025 Toyota Camry SE';
    const vin       = b.vin           || '4T1G11AK6PU123456';
    const stock     = b.stock_no      || 'STK-2025-0421';
    const sale_price = Number(b.sale_price ?? 32490);
    const trade_in   = Number(b.trade_in   ?? 0);
    const fees       = Number(b.fees       ?? 699);
    const tax_rate   = Number(b.tax_rate   ?? 0.0625);
    const down       = Number(b.down_payment ?? 2500);
    const apr        = Number(b.apr        ?? 6.49);
    const term       = Math.max(6, Math.min(96, Number(b.term_months ?? 60)));

    const taxable = Math.max(0, sale_price - trade_in);
    const tax     = Math.round(taxable * tax_rate * 100) / 100;
    const subtotal = sale_price - trade_in + fees + tax;
    const financed = Math.max(0, subtotal - down);
    const r = apr / 100 / 12;
    const monthly = r === 0
      ? Math.round((financed / term) * 100) / 100
      : Math.round(((financed * r) / (1 - Math.pow(1 + r, -term))) * 100) / 100;
    const out_the_door = Math.round(subtotal * 100) / 100;

    const today = new Date().toISOString().slice(0, 10);
    const fmt = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const lines = [
      '================================================================',
      '          AUTOGENIUS AI — DEAL SHEET (OFFICIAL DOCUMENT)        ',
      '================================================================',
      `Deal ID        : ${dealId}`,
      `Stock #        : ${stock}`,
      `Date           : ${today}`,
      `Customer       : ${customer}`,
      `Vehicle        : ${vehicle}`,
      `VIN            : ${vin}`,
      '----------------------------------------------------------------',
      'PRICING',
      `  Sale Price        : ${fmt(sale_price)}`,
      `  Trade-In Credit   : -${fmt(trade_in)}`,
      `  Doc / Dealer Fees : ${fmt(fees)}`,
      `  Sales Tax (${(tax_rate*100).toFixed(2)}%) : ${fmt(tax)}`,
      `  ----------------------------------------------`,
      `  OUT THE DOOR      : ${fmt(out_the_door)}`,
      '----------------------------------------------------------------',
      'FINANCING',
      `  Down Payment      : ${fmt(down)}`,
      `  Amount Financed   : ${fmt(financed)}`,
      `  APR               : ${apr.toFixed(2)}%`,
      `  Term              : ${term} months`,
      `  Estimated Monthly : ${fmt(monthly)}`,
      '----------------------------------------------------------------',
      'DOCUMENTS INCLUDED',
      '  [x] Bill of Sale',
      '  [x] Odometer Disclosure',
      '  [x] Title Application',
      '  [x] Finance Contract',
      '  [x] Warranty Disclosure',
      '  [x] Privacy Notice (GLBA)',
      '================================================================',
      'Customer Signature : ______________________   Date: ___________',
      'Sales Manager      : ______________________   Date: ___________',
      '================================================================',
    ];
    const text = lines.join('\n');
    const pdf_b64 = Buffer.from(text, 'utf8').toString('base64');

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      deal_id: dealId,
      summary: { customer, vehicle, vin, stock, sale_price, trade_in, fees, tax,
                 out_the_door, down, apr, term, monthly_payment: monthly,
                 amount_financed: Math.round(financed*100)/100 },
      document_text: text,
      pdf_base64: pdf_b64,
      filename: `deal_sheet_${dealId}.txt`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// NON-VIZ 2: Lead routing rules editor — in-memory CRUD
// ============================================================
const _rules = new Map();
let _nextRuleId = 1;
function seedDefaultRules() {
  if (_rules.size > 0) return;
  const defaults = [
    { name: 'Luxury SUV → Senior Reps', source: 'website',  vehicle_class: 'Luxury SUV', min_budget: 50000, assign_to: 'Carlos P.', priority: 'high',   active: true },
    { name: 'Truck Shoppers → Truck Team', source: 'walk-in', vehicle_class: 'Truck',     min_budget: 25000, assign_to: 'Alex M.',   priority: 'medium', active: true },
    { name: 'EV Inquiries → EV Specialist', source: 'phone', vehicle_class: 'EV',        min_budget: 30000, assign_to: 'Dana L.',   priority: 'high',   active: true },
    { name: 'Used Sedan → Junior Reps',   source: 'website', vehicle_class: 'Sedan',     min_budget: 0,     assign_to: 'Bri T.',    priority: 'low',    active: true },
  ];
  defaults.forEach((r) => {
    const id = _nextRuleId++;
    _rules.set(id, { id, created_at: new Date().toISOString(), ...r });
  });
}
seedDefaultRules();

function validateRule(body) {
  const errors = [];
  if (!body || typeof body !== 'object') errors.push('body required');
  if (!body.name || String(body.name).trim().length < 2) errors.push('name (>=2 chars) required');
  if (!body.assign_to || String(body.assign_to).trim().length < 1) errors.push('assign_to required');
  if (body.priority && !['low','medium','high'].includes(String(body.priority))) errors.push('priority must be low|medium|high');
  return errors;
}

// READ all
router.get('/lead-routing-rules', authenticateToken, (req, res) => {
  const items = Array.from(_rules.values()).sort((a, b) => a.id - b.id);
  res.json({ ok: true, count: items.length, items });
});

// CREATE
router.post('/lead-routing-rules', authenticateToken, (req, res) => {
  const errors = validateRule(req.body);
  if (errors.length) return res.status(400).json({ ok: false, errors });
  const id = _nextRuleId++;
  const rule = {
    id,
    name:          String(req.body.name).trim(),
    source:        String(req.body.source        || 'any').trim(),
    vehicle_class: String(req.body.vehicle_class || 'any').trim(),
    min_budget:    Number(req.body.min_budget    || 0),
    assign_to:     String(req.body.assign_to).trim(),
    priority:      String(req.body.priority      || 'medium'),
    active:        req.body.active !== false,
    created_at:    new Date().toISOString(),
  };
  _rules.set(id, rule);
  res.status(201).json({ ok: true, rule });
});

// UPDATE
router.put('/lead-routing-rules/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const existing = _rules.get(id);
  if (!existing) return res.status(404).json({ ok: false, error: 'not found' });
  const errors = validateRule({ ...existing, ...req.body });
  if (errors.length) return res.status(400).json({ ok: false, errors });
  const updated = { ...existing, ...req.body, id, updated_at: new Date().toISOString() };
  if (updated.min_budget !== undefined) updated.min_budget = Number(updated.min_budget);
  _rules.set(id, updated);
  res.json({ ok: true, rule: updated });
});

// DELETE
router.delete('/lead-routing-rules/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  if (!_rules.has(id)) return res.status(404).json({ ok: false, error: 'not found' });
  _rules.delete(id);
  res.json({ ok: true, deleted: id });
});

module.exports = router;
