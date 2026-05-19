import React, { useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

const DEFAULTS = {
  customer_name: 'Sarah Lopez',
  vehicle: '2025 Toyota Camry SE',
  vin: '4T1G11AK6PU123456',
  stock_no: 'STK-2025-0421',
  sale_price: 32490,
  trade_in: 4500,
  fees: 699,
  tax_rate: 0.0625,
  down_payment: 2500,
  apr: 6.49,
  term_months: 60,
};

function DealSheetPDF() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const generate = async () => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/custom-views/deal-sheet-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const j = await resp.json();
      setResult(j);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.document_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename || 'deal_sheet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="cv-deal-sheet-pdf"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <h3 style={{ color: '#f1f5f9', margin: 0, marginBottom: 12 }}>Deal Sheet PDF</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <input value={form.customer_name} onChange={update('customer_name')} placeholder="Customer" style={inp} />
        <input value={form.vehicle}       onChange={update('vehicle')}       placeholder="Vehicle"  style={inp} />
        <input value={form.vin}           onChange={update('vin')}           placeholder="VIN"      style={inp} />
        <input value={form.stock_no}      onChange={update('stock_no')}      placeholder="Stock#"   style={inp} />
        <input value={form.sale_price}    onChange={update('sale_price')}    placeholder="Sale price" style={inp} />
        <input value={form.trade_in}      onChange={update('trade_in')}      placeholder="Trade-in"   style={inp} />
        <input value={form.down_payment}  onChange={update('down_payment')}  placeholder="Down"       style={inp} />
        <input value={form.apr}           onChange={update('apr')}           placeholder="APR %"      style={inp} />
        <input value={form.term_months}   onChange={update('term_months')}   placeholder="Term mo."   style={inp} />
        <input value={form.fees}          onChange={update('fees')}          placeholder="Fees"       style={inp} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generate} disabled={loading}
                style={btn}>
          {loading ? 'Generating…' : 'Generate Deal Sheet'}
        </button>
        {result && (
          <button onClick={download} style={{ ...btn, background: '#0ea5e9' }}>Download .txt</button>
        )}
      </div>

      {err && <div style={{ color: '#ef4444', marginTop: 10 }}>Error: {err}</div>}

      {result && (
        <pre
          data-testid="cv-deal-sheet-output"
          style={{
            marginTop: 14,
            color: '#cbd5e1',
            background: '#020617',
            padding: 12,
            borderRadius: 6,
            fontSize: 11,
            lineHeight: 1.45,
            maxHeight: 320,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.document_text}
        </pre>
      )}
    </div>
  );
}

const inp = {
  background: '#1e293b',
  color: '#e2e8f0',
  border: '1px solid rgba(148,163,184,0.20)',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 12,
};
const btn = {
  background: '#6366f1',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '8px 12px',
  fontSize: 13,
  cursor: 'pointer',
};

export default DealSheetPDF;
