
import React, { useState } from 'react';
export function AIResultView({ value, label }) {
  if (value === null || value === undefined) return <div><strong>{label}:</strong> — (empty)</div>;
  if (value === false || value === 0 || value === '') return <div><strong>{label}:</strong> {String(value) || '— (empty)'}</div>;
  if (Array.isArray(value)) return <div><strong>{label}:</strong>{value.length === 0 ? ' — (empty)' : <ul>{value.map((v, i) => <li key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>)}</ul>}</div>;
  if (typeof value === 'object') return <section style={{border:'1px solid #ddd',padding:12,margin:'8px 0'}}>{label && <h4>{label}</h4>}{Object.entries(value).map(([k, v]) => <AIResultView key={k} label={k} value={v} />)}</section>;
  return <div><strong>{label}:</strong> {String(value)}</div>;
}
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
async function req(path, opts = {}) { const r = await fetch(`/api/feature-pack${path}`, { ...opts, headers: headers() }); const t = await r.text(); let d; try { d = JSON.parse(t); } catch { d = t; } if (!r.ok) throw new Error((d && d.error) || 'Request failed'); return d; }
export default function FeaturePack29a() {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [records, setRecords] = useState([]);
  const [tasks, setTasks] = useState([]); const [title, setTitle] = useState(''); const [ai, setAi] = useState(null); const [msg, setMsg] = useState('');
  const features = [{"slug": "pricing-check", "label": "Pricing check"}, {"slug": "inventory-aging", "label": "Inventory aging"}, {"slug": "margin-summary", "label": "Margin summary"}];
  const loadRecords = async () => { try { const d = await req(`/records/search?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`); setRecords(d.data || []); } catch (e) { setMsg(e.message); } };
  const loadTasks = async () => { try { const d = await req('/tasks'); setTasks(d.data || []); } catch (e) { setMsg(e.message); } };
  const exportAs = async (fmt) => { const r = await fetch(`/api/feature-pack/records/export?format=${fmt}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, { headers: headers() }); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `records.${fmt}`; a.click(); URL.revokeObjectURL(u); };
  const createTask = async () => { await req('/tasks', { method: 'POST', body: JSON.stringify({ title }) }); setTitle(''); loadTasks(); };
  const toggle = async (t) => { await req(`/tasks/${t.id}`, { method: 'PUT', body: JSON.stringify({ status: t.status === 'done' ? 'todo' : 'done' }) }); loadTasks(); };
  const runAI = async (slug) => { try { const d = await req(`/ai/${slug}`, { method: 'POST', body: JSON.stringify({ record: records[0] || {}, records }) }); setAi(d); } catch (e) { setMsg(e.message); } };
  return <div style={{padding:20}}><h2>Inventory Tasks, Search & AI</h2>{msg && <p>{msg}</p>}
    <section><h3>Search & export inventory</h3><input aria-label="Search records" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search records" /><input aria-label="Filter by status" value={status} onChange={e=>setStatus(e.target.value)} placeholder="Filter by status" /><button onClick={loadRecords}>Search</button><button onClick={()=>exportAs('csv')}>Export CSV</button><button onClick={()=>exportAs('json')}>Export JSON</button><p>{records.length} record(s)</p><ul>{records.slice(0,20).map((r,i)=><li key={r.id||i}>{String(r.name||r.title||r.make||r.plot_number||r.id||'record')} — {String(r.status??'')}</li>)}</ul></section>
    <section><h3>My tasks</h3><button onClick={loadTasks}>Load tasks</button><input aria-label="Task title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title" /><button onClick={createTask}>Create task</button><ul>{tasks.map(t=><li key={t.id}>{t.title} — {t.status} <button onClick={()=>toggle(t)}>{t.status==='done'?'Reopen':'Done'}</button></li>)}</ul></section>
    <section><h3>AI insights</h3><p>Provider runs only when a server API key is configured; otherwise a clearly labelled deterministic fallback is shown.</p>{features.map(f=><button key={f.slug} onClick={()=>runAI(f.slug)}>{f.label}</button>)}{ai && <div><p>aiGenerated: {String(ai.aiGenerated)} {ai.label||''}</p><AIResultView label={ai.feature} value={ai.result} /></div>}</section></div>;
}
