import React, { useState } from 'react';
import { tradeInConfidenceScore } from '../services/api';

const sample = JSON.stringify({
  vehicle: { year: 2020, make: 'Honda', model: 'CR-V', mileage: 61500 },
  condition: 'clean title, minor bumper repaint, tires at 5/32',
  payoff: 14500,
  offer: 21750,
  marketRange: { low: 20500, high: 23800 }
}, null, 2);

export default function TradeInConfidencePage() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await tradeInConfidenceScore(JSON.parse(payload));
      setResult(data);
    } catch (err) {
      setError(err.message || 'Score failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ padding: 20 }}>
      <h1>Trade-In Desk Confidence</h1>
      <p>Score offer confidence, equity, and reconditioning risk before the desk commits.</p>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <textarea value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} style={{ width: '100%', fontFamily: 'monospace' }} />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Scoring...' : 'Score trade-in'}</button>
        </div>
        <div className="card">
          {result ? (
            <div>
              <h2>{result.vehicleLabel}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Metric label="Confidence" value={`${result.confidence}%`} />
                <Metric label="Equity" value={`$${Math.round(result.equity).toLocaleString()}`} />
                <Metric label="Recon" value={result.reconditioningRisk} />
              </div>
              <h3>Desk range</h3>
              <p>Floor ${result.deskRange.floor.toLocaleString()} | Target ${result.deskRange.target.toLocaleString()} | Stretch ${result.deskRange.stretch.toLocaleString()}</p>
              <ul>{result.talkingPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          ) : (
            <p>Run a score to see the desk recommendation.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: '#f5f7fb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}
