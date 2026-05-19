import React, { useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function DealJacketPDF() {
  const [form, setForm] = useState({
    deal_id: 'DJ-1042',
    customer_name: 'Jane Doe',
    vehicle: '2024 Toyota RAV4 XLE',
    vin: '4T3W11AE0PU012345',
    sale_price: 32990,
    trade_in: 5500,
    fees: 599,
    tax_rate: 0.0625,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const update = (k) => (e) => {
    const v = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const generate = async () => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/custom-views/deal-jacket`, {
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

  const download = () => {
    if (!data) return;
    const blob = new Blob([data.document_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = data.filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="cv-deal-jacket"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <h3 style={{ color: '#f1f5f9', marginTop: 0 }}>Deal Jacket Generator</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {[
          ['deal_id', 'Deal ID', 'text'],
          ['customer_name', 'Customer', 'text'],
          ['vehicle', 'Vehicle', 'text'],
          ['vin', 'VIN', 'text'],
          ['sale_price', 'Sale Price', 'number'],
          ['trade_in', 'Trade-In', 'number'],
          ['fees', 'Fees', 'number'],
          ['tax_rate', 'Tax Rate', 'number'],
        ].map(([k, label, type]) => (
          <label key={k} style={{ display: 'block', color: '#94a3b8', fontSize: 12 }}>
            {label}
            <input
              type={type}
              step={type === 'number' ? '0.01' : undefined}
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
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate Deal Jacket'}
        </button>
        {data && (
          <button
            onClick={download}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Download
          </button>
        )}
      </div>
      {err && <div style={{ color: '#ef4444', marginTop: 10 }}>{err}</div>}
      {data && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
            Out The Door: <strong style={{ color: '#4ade80' }}>${data.summary.out_the_door.toLocaleString()}</strong>
            {' · '}Tax: ${data.summary.tax.toLocaleString()}
          </div>
          <pre
            style={{
              background: '#020617',
              color: '#cbd5e1',
              padding: 12,
              borderRadius: 4,
              fontSize: 11,
              overflow: 'auto',
              maxHeight: 320,
              margin: 0,
            }}
          >
            {data.document_text}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DealJacketPDF;
