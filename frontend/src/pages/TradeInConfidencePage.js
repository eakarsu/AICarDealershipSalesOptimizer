import React, { useState } from 'react';
import AIReport from '../components/AIReport';
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
          <div className="ai-preset-bar"><div><strong>Complete fictional trade-in examples</strong><p>Includes optional payoff, offer and market range. Verify title and condition evidence separately.</p></div><div className="ai-actions">{['Standard trade-in', 'Higher mileage', 'Equity review'].map((label, index) => <button key={label} type="button" className="btn btn-secondary" disabled={loading} onClick={() => { const value = JSON.parse(sample); value.vehicle.mileage += index * 12000; value.payoff += index * 2000; value.offer -= index * 1000; setPayload(JSON.stringify(value, null, 2)); }}>{label}</button>)}</div></div>
          <textarea aria-label="Trade-in request JSON" value={payload} onChange={(event) => setPayload(event.target.value)} rows={16} style={{ width: '100%', fontFamily: 'monospace' }} />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Scoring...' : 'Score trade-in'}</button>
        </div>
        <div className="card">
          {result ? <AIReport response={result} title="Trade-in confidence report" /> : <p>Run a score to see the desk recommendation.</p>}
        </div>
      </div>
    </div>
  );
}
