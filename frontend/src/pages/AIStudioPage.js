import React, { useEffect, useState } from 'react';
import {
  aiTradeInPhoto, aiInventoryAging, aiPaymentOptimizer, aiMarketDemand,
  aiCustomerPersona, aiWarrantyAnalyzer, aiComplianceChecker, aiSalesCoach,
  aiResultsHistory,
} from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const SAMPLES = {
  'trade-in-photo': {
    fn: aiTradeInPhoto,
    label: 'Trade-In Photo Analyzer',
    description: 'Assess vehicle condition, estimate reconditioning, predict pricing impact from a description',
    payload: {
      vehicle_info: { year: 2019, make: 'Toyota', model: 'Camry', trim: 'XLE', mileage: 62000, color: 'Silver' },
      condition_description: 'Minor curb rash on front-left wheel; small dent on passenger door; interior generally clean with worn driver seat bolster; tires at 4/32; check engine light recently cleared.',
    },
  },
  'inventory-aging': {
    fn: aiInventoryAging,
    label: 'Inventory Aging Analyzer',
    description: 'Identify slow movers, recommend markdowns and auction candidates',
    payload: {
      inventory: [
        { id: 1, year: 2022, make: 'Ford', model: 'F-150', listing_price: 48500, days_on_lot: 92, mileage: 24000 },
        { id: 2, year: 2023, make: 'Tesla', model: 'Model 3', listing_price: 41990, days_on_lot: 18, mileage: 12000 },
        { id: 3, year: 2021, make: 'BMW', model: 'X3', listing_price: 38800, days_on_lot: 145, mileage: 38000 },
        { id: 4, year: 2020, make: 'Honda', model: 'Civic', listing_price: 22500, days_on_lot: 215, mileage: 56000 },
      ],
    },
  },
  'payment-optimizer': {
    fn: aiPaymentOptimizer,
    label: 'Payment Optimizer',
    description: 'Optimal financing terms and default risk for a deal',
    payload: { credit_score: 695, down_payment: 5000, vehicle_price: 32500 },
  },
  'market-demand': {
    fn: aiMarketDemand,
    label: 'Market Demand Predictor',
    description: 'Demand by model + ZIP + season; stocking priorities and shortage alerts',
    payload: { models: ['Toyota RAV4', 'Honda CR-V', 'Tesla Model Y', 'Ford F-150'], zip_code: '94110', season: 'Spring' },
  },
  'customer-persona': {
    fn: aiCustomerPersona,
    label: 'Customer Persona Builder',
    description: 'Build persona profile, predict repeat purchase probability, surface upsell opportunities',
    payload: {
      customer: {
        first_name: 'Maria', last_name: 'Lopez', age: 38, household_income: 142000,
        zip_code: '94110', credit_score_range: '720-760', preferred_make: 'Toyota',
        preferred_type: 'SUV', children: 2,
      },
      purchase_history: [
        { year: 2018, vehicle: '2018 Toyota Highlander', price: 42000, financed: true, term_months: 60 },
        { year: 2022, vehicle: '2022 Toyota RAV4 Hybrid', price: 36500, financed: true, term_months: 72 },
      ],
    },
  },
  'warranty-analyzer': {
    fn: aiWarrantyAnalyzer,
    label: 'Extended Warranty Analyzer',
    description: 'Track claims by model/year, recommend warranty packages, calculate profitability',
    payload: {
      vehicle: { year: 2021, make: 'BMW', model: 'X3', mileage: 38000, msrp: 49000, current_price: 38800 },
      claims_history: [
        { component: 'turbocharger', average_cost: 4200, frequency_pct: 8 },
        { component: 'transmission cooler', average_cost: 1800, frequency_pct: 12 },
        { component: 'electronic suspension', average_cost: 3200, frequency_pct: 6 },
      ],
      customer_profile: { credit_score_range: '700-740', annual_mileage: 14000, ownership_horizon_years: 5 },
    },
  },
  'compliance-checker': {
    fn: aiComplianceChecker,
    label: 'Compliance Document Checker',
    description: 'Verify trade-in title, detect liens, recall lookup, emissions check, flag closing blockers',
    payload: {
      trade_in: {
        year: 2018, make: 'Honda', model: 'Accord', vin: '1HGCV1F30JA123456',
        state: 'California', odometer: 78500, title_status: 'Clean (claimed)',
        registered_owner: 'John Smith',
      },
      documents: [
        { document: 'Title', status: 'Provided' },
        { document: 'Smog Cert', status: 'Missing' },
        { document: 'Lien Release', status: 'Pending' },
      ],
    },
  },
  'sales-coach': {
    fn: aiSalesCoach,
    label: 'Sales Skill Coaching',
    description: 'Identify objection-handling gaps, suggest scripts, track rep improvement',
    payload: {
      rep_profile: {
        name: 'Sarah Williams', tenure_months: 14, role: 'Sales Consultant',
        ytd_units: 78, ytd_gross: 218000, close_rate_pct: 18, avg_gross_per_deal: 2795,
      },
      recent_interactions: [
        { type: 'test_drive', vehicle: '2024 Toyota RAV4', outcome: 'No commitment', objection: 'Wants to think about it', rep_response: 'Suggested they sleep on it' },
        { type: 'phone_call', subject: 'Follow-up after test drive', outcome: 'No answer; left voicemail', notes: 'Generic message, no value-add' },
        { type: 'in_person', vehicle: '2024 Honda CR-V', outcome: 'Lost to competitor', objection: 'Price too high', rep_response: 'Offered $500 off' },
        { type: 'phone_call', subject: 'Lead from website', outcome: 'Set appointment', notes: 'Great rapport building, asked discovery questions' },
      ],
    },
  },
};

export default function AIStudioPage() {
  const [activeKey, setActiveKey] = useState('customer-persona');
  const [payload, setPayload] = useState(JSON.stringify(SAMPLES[activeKey].payload, null, 2));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('');

  const active = SAMPLES[activeKey];

  useEffect(() => {
    setPayload(JSON.stringify(SAMPLES[activeKey].payload, null, 2));
    setResult(null);
    setError(null);
  }, [activeKey]);

  const loadHistory = async (page = 1, feature = '') => {
    try {
      const res = await aiResultsHistory(page, 10, feature);
      setHistory(res.data || []);
      setHistoryTotal(res.pagination?.totalPages || 1);
      setHistoryPage(page);
    } catch (e) {
      setHistory([]);
    }
  };

  useEffect(() => { loadHistory(1, historyFilter); }, [historyFilter]);

  const run = async () => {
    let body;
    try { body = JSON.parse(payload); }
    catch { setError('Payload must be valid JSON'); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await active.fn(body);
      setResult(res);
      loadHistory(1, historyFilter);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h1>AI Studio</h1>
        <p style={{ color: '#94a3b8' }}>8 dealership AI tools — feed inputs, get structured analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 12, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Tools</h3>
          {Object.entries(SAMPLES).map(([key, s]) => (
            <div
              key={key}
              onClick={() => setActiveKey(key)}
              style={{
                padding: '10px 12px',
                marginBottom: 6,
                borderRadius: 6,
                cursor: 'pointer',
                background: activeKey === key ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                color: activeKey === key ? 'white' : '#e2e8f0',
                fontSize: 13,
                fontWeight: activeKey === key ? 600 : 400,
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{active.label}</h2>
            <p style={{ color: '#94a3b8', marginTop: 4 }}>{active.description}</p>

            <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Request Payload (JSON)</label>
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              rows={14}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 12, border: '1px solid #334155', borderRadius: 6, background: '#0f172a', color: '#e2e8f0' }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={run} disabled={loading} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Running...' : `Run ${active.label}`}
              </button>
              <button onClick={() => setPayload(JSON.stringify(active.payload, null, 2))} disabled={loading} style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}>
                Reset to Sample
              </button>
            </div>
          </div>

          <AIResultDisplay result={result} loading={loading} error={error} type={activeKey} />

          <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>AI Results History</h3>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ padding: 6, border: '1px solid #475569', borderRadius: 4, background: '#1e293b', color: '#e2e8f0' }}>
                <option value="">All features</option>
                <option value="trade-in-photo-analysis">Trade-In Photo</option>
                <option value="inventory-aging">Inventory Aging</option>
                <option value="payment-optimizer">Payment Optimizer</option>
                <option value="market-demand">Market Demand</option>
                <option value="customer-persona">Customer Persona</option>
                <option value="warranty-analyzer">Warranty Analyzer</option>
                <option value="compliance-checker">Compliance Checker</option>
                <option value="sales-coach">Sales Coach</option>
              </select>
            </div>
            {history.length === 0 && <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>No stored results yet.</div>}
            {history.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Feature</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Created</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: 8 }}>#{h.id}</td>
                      <td style={{ padding: 8, fontSize: 12, color: '#a78bfa' }}>{h.feature}</td>
                      <td style={{ padding: 8, fontSize: 12 }}>{new Date(h.created_at).toLocaleString()}</td>
                      <td style={{ padding: 8, fontSize: 12, color: '#94a3b8', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(h.output).substring(0, 120)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, justifyContent: 'center' }}>
              <button disabled={historyPage <= 1} onClick={() => loadHistory(historyPage - 1, historyFilter)} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #475569', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>Previous</button>
              <span>Page {historyPage} of {historyTotal}</span>
              <button disabled={historyPage >= historyTotal} onClick={() => loadHistory(historyPage + 1, historyFilter)} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #475569', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
