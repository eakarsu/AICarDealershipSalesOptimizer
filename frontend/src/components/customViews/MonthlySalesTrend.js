import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5847/api';

function MonthlySalesTrend() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/monthly-sales-trend`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading sales trend...</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const W = 720;
  const H = 220;
  const pad = 32;
  const maxRev = Math.max(1, ...data.series.map((s) => s.revenue));
  const stepX = (W - pad * 2) / Math.max(1, data.series.length - 1);
  const points = data.series
    .map((s, i) => {
      const x = pad + i * stepX;
      const y = H - pad - (s.revenue / maxRev) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      data-testid="cv-sales-trend"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: '#f1f5f9', margin: 0 }}>Monthly Sales Trend (12 mo)</h3>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {data.total_deals} deals · ${data.total_revenue.toLocaleString()}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="cvArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={pad}
            x2={W - pad}
            y1={pad + t * (H - pad * 2)}
            y2={pad + t * (H - pad * 2)}
            stroke="rgba(148,163,184,0.12)"
          />
        ))}
        <polygon
          fill="url(#cvArea)"
          points={`${pad},${H - pad} ${points} ${W - pad},${H - pad}`}
        />
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
        {data.series.map((s, i) => {
          const x = pad + i * stepX;
          const y = H - pad - (s.revenue / maxRev) * (H - pad * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill="#06b6d4" />
              <text x={x} y={H - 8} fontSize="10" fill="#94a3b8" textAnchor="middle">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {data.series.map((s, i) => (
          <div key={i} style={{ color: '#64748b', fontSize: 11 }}>
            <strong style={{ color: '#cbd5e1' }}>{s.label}</strong>: {s.deals} deals
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthlySalesTrend;
