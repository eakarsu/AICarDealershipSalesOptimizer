import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5847/api';
const ENDPOINT = `${API_BASE}/custom-views/lead-routing-rules`;

const EMPTY = {
  name: '',
  source: 'website',
  vehicle_class: 'any',
  min_budget: 0,
  assign_to: '',
  priority: 'medium',
  active: true,
};

function LeadRoutingRules() {
  const [rules, setRules] = useState([]);
  const [editing, setEditing] = useState(null);   // rule id or 'new'
  const [draft, setDraft] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const token = () => localStorage.getItem('token');

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json();
      setRules(j.items || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startNew  = () => { setEditing('new'); setDraft(EMPTY); };
  const startEdit = (r) => { setEditing(r.id); setDraft({ ...r }); };
  const cancel    = () => { setEditing(null); setDraft(EMPTY); };

  const save = async () => {
    setErr(null);
    try {
      const isNew = editing === 'new';
      const url = isNew ? ENDPOINT : `${ENDPOINT}/${editing}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...draft, min_budget: Number(draft.min_budget) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.errors || [j.error]).join(', '));
      cancel();
      await load();
    } catch (e) { setErr(e.message); }
  };

  const del = async (id) => {
    setErr(null);
    try {
      const r = await fetch(`${ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `delete failed (${r.status})`);
      }
      await load();
    } catch (e) { setErr(e.message); }
  };

  const upd = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <div
      data-testid="cv-lead-routing"
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ color: '#f1f5f9', margin: 0 }}>Lead Routing Rules</h3>
        <button onClick={startNew} style={btn}>+ Add Rule</button>
      </div>

      {err && <div style={{ color: '#ef4444', marginBottom: 8 }}>Error: {err}</div>}
      {loading && <div style={{ color: '#94a3b8' }}>Loading…</div>}

      <table style={{ width: '100%', color: '#e2e8f0', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
            <th style={th}>#</th>
            <th style={th}>Name</th>
            <th style={th}>Source</th>
            <th style={th}>Vehicle</th>
            <th style={th}>Min $</th>
            <th style={th}>Assign To</th>
            <th style={th}>Priority</th>
            <th style={th}>Active</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
              <td style={td}>{r.id}</td>
              <td style={td}>{r.name}</td>
              <td style={td}>{r.source}</td>
              <td style={td}>{r.vehicle_class}</td>
              <td style={td}>${Number(r.min_budget||0).toLocaleString()}</td>
              <td style={td}>{r.assign_to}</td>
              <td style={td}>{r.priority}</td>
              <td style={td}>{r.active ? 'yes' : 'no'}</td>
              <td style={td}>
                <button onClick={() => startEdit(r)} style={miniBtn}>Edit</button>
                <button onClick={() => del(r.id)} style={{ ...miniBtn, background: '#7f1d1d' }}>Del</button>
              </td>
            </tr>
          ))}
          {rules.length === 0 && !loading && (
            <tr><td colSpan={9} style={{ ...td, color: '#94a3b8', textAlign: 'center', padding: 16 }}>No rules — click "Add Rule".</td></tr>
          )}
        </tbody>
      </table>

      {editing !== null && (
        <div style={{ marginTop: 14, padding: 12, border: '1px solid rgba(99,102,241,0.30)', borderRadius: 6 }}>
          <div style={{ color: '#a5b4fc', fontSize: 12, marginBottom: 8 }}>
            {editing === 'new' ? 'New rule' : `Edit rule #${editing}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <input value={draft.name}          onChange={upd('name')}          placeholder="Name"          style={inp} />
            <input value={draft.source}        onChange={upd('source')}        placeholder="Source"        style={inp} />
            <input value={draft.vehicle_class} onChange={upd('vehicle_class')} placeholder="Vehicle class" style={inp} />
            <input value={draft.min_budget}    onChange={upd('min_budget')}    placeholder="Min budget"    style={inp} />
            <input value={draft.assign_to}     onChange={upd('assign_to')}     placeholder="Assign to"     style={inp} />
            <select value={draft.priority}    onChange={upd('priority')} style={inp}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={save}   style={btn}>Save</button>
            <button onClick={cancel} style={{ ...btn, background: '#475569' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { padding: '6px 6px', fontWeight: 500 };
const td = { padding: '6px 6px' };
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
const miniBtn = {
  background: '#334155',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  marginRight: 4,
};

export default LeadRoutingRules;
