import React, { useEffect, useState } from 'react';
import { listWebhooks, createWebhook, deleteWebhook, testWebhook } from '../services/api';

const ALLOWED_EVENTS = [
  'lead.created',
  'lead.qualified',
  'deal.opened',
  'deal.closed_won',
  'deal.closed_lost',
  'test_drive.scheduled',
  'service_appointment.scheduled',
  'inventory.added',
  'inventory.sold',
  'commission.calculated',
  'campaign.launched',
];

function WebhooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ url: '', secret: '', events: ['lead.created'] });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await listWebhooks();
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const toggleEvent = (ev) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.url) { setError('URL is required'); return; }
    if (form.events.length === 0) { setError('Select at least one event'); return; }
    setCreating(true); setError('');
    try {
      await createWebhook({ url: form.url, events: form.events, secret: form.secret || null });
      setForm({ url: '', secret: '', events: ['lead.created'] });
      load();
    } catch (e) { setError(e.message); }
    setCreating(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this webhook?')) return;
    try {
      await deleteWebhook(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) { setError(e.message); }
  };

  const test = async (id) => {
    setTestResult(null); setError('');
    try {
      const r = await testWebhook(id);
      setTestResult(r);
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔔 Webhook Subscriptions</h1>
        <p>Subscribe external systems to dealership events</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>+ New Subscription</h3>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Endpoint URL</label>
              <input type="url" placeholder="https://example.com/hooks/dealership" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Signing Secret (optional)</label>
              <input type="text" placeholder="hex/base64" value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Events</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALLOWED_EVENTS.map((ev) => (
                <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} />
                  <span>{ev}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Subscription'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Active Webhooks</h3>
        {loading && <p>Loading...</p>}
        {!loading && items.length === 0 && <p>No webhooks subscribed yet.</p>}
        {!loading && items.length > 0 && (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>URL</th><th>Events</th><th>Active</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>{w.id}</td>
                  <td style={{ wordBreak: 'break-all', maxWidth: 280 }}>{w.url}</td>
                  <td style={{ fontSize: 12 }}>{(w.events || []).join(', ')}</td>
                  <td>{w.active ? 'Yes' : 'No'}</td>
                  <td>{w.created_at ? new Date(w.created_at).toLocaleString() : ''}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => test(w.id)} style={{ marginRight: 8 }}>Test</button>
                    <button className="btn-secondary" onClick={() => remove(w.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {testResult && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Test Payload</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default WebhooksPage;
