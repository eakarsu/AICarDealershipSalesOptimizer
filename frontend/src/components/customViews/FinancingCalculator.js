import React, { useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function FinancingCalculator() {
  const [form, setForm] = useState({
    price: 32990,
    down_payment: 3500,
    trade_in: 5500,
    apr: 6.49,
    term_months: 60,
    tax_rate: 0.0625,
    fees: 599,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const calc = async () => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/custom-views/financing-calc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setData(j);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="cv-financing-calc"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <h3 style={{ color: '#f1f5f9', marginTop: 0 }}>Financing Calculator</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          ['price', 'Vehicle Price'],
          ['down_payment', 'Down Payment'],
          ['trade_in', 'Trade-In'],
          ['apr', 'APR (%)'],
          ['term_months', 'Term (months)'],
          ['tax_rate', 'Tax Rate'],
          ['fees', 'Fees'],
        ].map(([k, label]) => (
          <label key={k} style={{ display: 'block', color: '#94a3b8', fontSize: 12 }}>
            {label}
            <input
              type="number"
              step="0.01"
              value={form[k]}
              onChange={update(k)}
              style={{
                width: '100%',
                marginTop: 4,
                padding: '6px 8px',
                background: '#1e293b',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                color: '#f1f5f9',
              }}
            />
          </label>
        ))}
      </div>
      <button
        onClick={calc}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: '#8b5cf6',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        {loading ? 'Calculating...' : 'Calculate Payment'}
      </button>
      {err && <div style={{ color: '#ef4444', marginTop: 10 }}>{err}</div>}
      {data && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 4 }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Monthly Payment</div>
              <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 700 }}>
                ${data.monthly_payment.toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 4 }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Financed</div>
              <div style={{ color: '#f1f5f9', fontSize: 18 }}>
                ${data.financed_amount.toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 4 }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Paid</div>
              <div style={{ color: '#f1f5f9', fontSize: 18 }}>
                ${data.total_paid.toLocaleString()}
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 10, borderRadius: 4 }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Interest</div>
              <div style={{ color: '#f59e0b', fontSize: 18 }}>
                ${data.total_interest.toLocaleString()}
              </div>
            </div>
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: '#cbd5e1',
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ background: '#1e293b' }}>
                {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                  <th key={h} style={{ padding: 8, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.schedule_preview.map((r) => (
                <tr key={r.month} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <td style={{ padding: 8 }}>{r.month}</td>
                  <td style={{ padding: 8 }}>${r.payment.toLocaleString()}</td>
                  <td style={{ padding: 8 }}>${r.principal.toLocaleString()}</td>
                  <td style={{ padding: 8 }}>${r.interest.toLocaleString()}</td>
                  <td style={{ padding: 8 }}>${r.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FinancingCalculator;
