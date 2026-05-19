import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function LotInventoryBars() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/lot-inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading lot inventory…</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const max = Math.max(1, ...(data.bars || []).map((b) => b.units));

  return (
    <div
      data-testid="cv-lot-inventory-bars"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: '#f1f5f9', margin: 0 }}>Lot Inventory by Make / Model</h3>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {data.total_models} models · {data.total_units} units
        </span>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {(data.bars || []).map((b, i) => {
          const pct = Math.round((b.units / max) * 100);
          return (
            <div key={`${b.make}-${b.model}-${i}`} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 70px', alignItems: 'center', gap: 12 }}>
              <div style={{ color: '#e2e8f0', fontSize: 13 }}>{b.make} {b.model}</div>
              <div style={{ background: 'rgba(148,163,184,0.10)', borderRadius: 4, overflow: 'hidden', height: 18 }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                }} />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'right' }}>${(b.avg_price/1000).toFixed(0)}k avg</div>
              <div style={{ color: '#f1f5f9', fontSize: 13, textAlign: 'right' }}>{b.units}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LotInventoryBars;
