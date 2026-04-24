import React, { useState, useEffect } from 'react';
import { getLeads, createLead, updateLead, deleteLead, aiScoreLead } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyLead = {
  customer_name: '', email: '', phone: '', source: 'Website', interest_type: 'New Vehicle',
  vehicle_interest: '', status: 'new', notes: ''
};

function LeadsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyLead);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setItems(await getLeads()); } catch (e) { console.error(e); } };

  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete this lead?')) return; await deleteLead(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...emptyLead }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSave = async () => {
    try {
      if (editing && selected) await updateLead(selected.id, formData);
      else await createLead(formData);
      setSelected(null); setShowNew(false); setEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiScoreLead(selected.id)); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const getScoreColor = (score) => {
    if (!score) return '#64748b';
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#f87171';
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group"><label>Customer Name</label><input name="customer_name" value={formData.customer_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} /></div>
            <div className="form-group"><label>Phone</label><input name="phone" value={formData.phone} onChange={handleChange} /></div>
            <div className="form-group"><label>Source</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option>Website</option><option>Walk-in</option><option>Phone Call</option><option>Referral</option><option>Social Media</option><option>Email Campaign</option><option>Third Party</option>
              </select>
            </div>
            <div className="form-group"><label>Interest Type</label>
              <select name="interest_type" value={formData.interest_type} onChange={handleChange}>
                <option>New Vehicle</option><option>Used Vehicle</option><option>Trade-In</option><option>Financing</option><option>Service</option>
              </select>
            </div>
            <div className="form-group"><label>Vehicle Interest</label><input name="vehicle_interest" value={formData.vehicle_interest} onChange={handleChange} /></div>
            <div className="form-group"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="lost">Lost</option>
              </select>
            </div>
            <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} /></div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button>
          <button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Lead Scoring</h2>
        <div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Lead</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Source</th><th>Interest</th><th>Vehicle</th><th>AI Score</th><th>Last Contact</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.customer_name}</strong></td>
                <td>{item.source}</td>
                <td>{item.interest_type}</td>
                <td>{item.vehicle_interest || '—'}</td>
                <td>
                  {item.ai_score ? (
                    <span style={{ color: getScoreColor(item.ai_score), fontWeight: 600 }}>{item.ai_score}</span>
                  ) : '—'}
                </td>
                <td>{item.last_contact ? new Date(item.last_contact).toLocaleDateString() : '—'}</td>
                <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected.customer_name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{selected.email}</div></div>
                <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{selected.phone}</div></div>
                <div className="detail-item"><div className="detail-label">Source</div><div className="detail-value">{selected.source}</div></div>
                <div className="detail-item"><div className="detail-label">Interest</div><div className="detail-value">{selected.interest_type}</div></div>
                <div className="detail-item"><div className="detail-label">Vehicle Interest</div><div className="detail-value">{selected.vehicle_interest || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">AI Score</div><div className="detail-value" style={{ color: getScoreColor(selected.ai_score) }}>{selected.ai_score || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Last Contact</div><div className="detail-value">{selected.last_contact ? new Date(selected.last_contact).toLocaleString() : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
              </div>
              {selected.notes && (
                <div className="detail-item" style={{ marginBottom: 16 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>
              )}
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="lead" />
            </div>
            <div className="modal-actions">
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Score Lead</button>
              <button className="btn-secondary" onClick={handleEdit}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default LeadsPage;
