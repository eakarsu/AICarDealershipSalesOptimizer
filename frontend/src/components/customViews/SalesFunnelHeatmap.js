import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function colorFor(value, max) {
  // 0 → dark navy, max → bright indigo/cyan
  const t = Math.max(0, Math.min(1, value / Math.max(1, max)));
  const r = Math.round(15  + t * 40);
  const g = Math.round(23  + t * 130);
  const b = Math.round(42  + t * 175);
  return `rgb(${r},${g},${b})`;
}

function SalesFunnelHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/sales-funnel-heatmap`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading funnel heatmap…</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const { stages = [], salespeople = [], cells = [], max_cell = 1 } = data;
  const get = (rep, stage) => cells.find((c) => c.rep === rep && c.stage === stage)?.count ?? 0;

  return (
    <div
      data-testid="cv-funnel-heatmap"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
        overflowX: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: '#f1f5f9', margin: 0 }}>Sales Funnel Heatmap (Stage × Salesperson)</h3>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>max cell: {max_cell}</span>
      </div>

      <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, textAlign: 'left', padding: '4px 6px' }}>Rep ↓ / Stage →</th>
            {stages.map((s) => (
              <th key={s} style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, padding: '4px 6px' }}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {salespeople.map((rep) => (
            <tr key={rep}>
              <td style={{ color: '#e2e8f0', fontSize: 12, padding: '4px 6px', whiteSpace: 'nowrap' }}>{rep}</td>
              {stages.map((s) => {
                const v = get(rep, s);
                return (
                  <td key={s}
                      title={`${rep} · ${s}: ${v}`}
                      style={{
                        background: colorFor(v, max_cell),
                        color: '#f1f5f9',
                        fontSize: 12,
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: 4,
                        minWidth: 48,
                      }}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SalesFunnelHeatmap;
