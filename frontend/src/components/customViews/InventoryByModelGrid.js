import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function InventoryByModelGrid() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/inventory-by-model`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading inventory grid...</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const max = Math.max(1, ...data.grid.map((g) => g.units));

  return (
    <div
      data-testid="cv-inventory-grid"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: '#f1f5f9', margin: 0 }}>Inventory Grid by Model</h3>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {data.total_models} models / {data.total_units} units
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {data.grid.map((row, i) => {
          const pct = Math.round((row.units / max) * 100);
          return (
            <div
              key={i}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <div style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {row.make} {row.model}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                {row.units} units · avg ${row.avg_price?.toLocaleString()}
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                avail {row.available} · res {row.reserved} · sold {row.sold} · {row.avg_days}d
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(148,163,184,0.15)',
                  borderRadius: 3,
                  marginTop: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InventoryByModelGrid;
