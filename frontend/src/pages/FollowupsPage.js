import React, { useState, useEffect } from 'react';
import { getFollowups, createFollowup, updateFollowup, deleteFollowup, aiAnalyzeFollowup, getCustomers } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const empty = { customer_id: '', customer_name: '', contact_type: 'Phone Call', direction: 'outbound', subject: '', notes: '', outcome: '', sales_person: '', follow_up_date: '', sentiment: 'Neutral', priority: 'Medium', status: 'pending' };

function FollowupsPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(empty);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const [f, c] = await Promise.all([getFollowups(), getCustomers()]); setItems(f); setCustomers(c); } catch (e) { console.error(e); } };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected, follow_up_date: selected.follow_up_date?.slice(0, 16) }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete?')) return; await deleteFollowup(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...empty }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleCustomerSelect = (e) => { const cid = e.target.value; const c = customers.find(x => x.id === parseInt(cid)); setFormData(prev => ({ ...prev, customer_id: cid, customer_name: c ? `${c.first_name} ${c.last_name}` : '' })); };
  const handleSave = async () => { try { if (editing && selected) await updateFollowup(selected.id, formData); else await createFollowup(formData); setSelected(null); setShowNew(false); setEditing(false); loadData(); } catch (e) { alert(e.message); } };
  const handleAI = async () => { setAiLoading(true); setAiError(null); setAiResult(null); try { setAiResult(await aiAnalyzeFollowup(selected.id)); } catch (e) { setAiError(e.message); } finally { setAiLoading(false); } };

  const getSentimentColor = (s) => s === 'Positive' ? '#4ade80' : s === 'Negative' ? '#f87171' : '#fbbf24';
  const getPriorityColor = (p) => p === 'High' ? '#f87171' : p === 'Medium' ? '#fbbf24' : '#4ade80';

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Follow-Up' : 'New Follow-Up'}</h3><button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button></div>
        <div className="modal-body"><div className="edit-form">
          <div className="form-group"><label>Customer</label><select name="customer_id" value={formData.customer_id} onChange={handleCustomerSelect}><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></div>
          <div className="form-group"><label>Contact Type</label><select name="contact_type" value={formData.contact_type} onChange={handleChange}><option>Phone Call</option><option>Email</option><option>Text</option><option>In-Person</option><option>Social Media</option></select></div>
          <div className="form-group"><label>Direction</label><select name="direction" value={formData.direction} onChange={handleChange}><option value="outbound">Outbound</option><option value="inbound">Inbound</option></select></div>
          <div className="form-group"><label>Subject</label><input name="subject" value={formData.subject} onChange={handleChange} /></div>
          <div className="form-group"><label>Outcome</label><select name="outcome" value={formData.outcome} onChange={handleChange}><option value="">Select</option><option>Connected</option><option>Voicemail</option><option>No Answer</option><option>Email Sent</option><option>Replied</option><option>Meeting Scheduled</option><option>Not Interested</option></select></div>
          <div className="form-group"><label>Sales Person</label><input name="sales_person" value={formData.sales_person} onChange={handleChange} /></div>
          <div className="form-group"><label>Follow-Up Date</label><input name="follow_up_date" type="datetime-local" value={formData.follow_up_date || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Sentiment</label><select name="sentiment" value={formData.sentiment} onChange={handleChange}><option>Positive</option><option>Neutral</option><option>Negative</option></select></div>
          <div className="form-group"><label>Priority</label><select name="priority" value={formData.priority} onChange={handleChange}><option>High</option><option>Medium</option><option>Low</option></select></div>
          <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="pending">Pending</option><option value="completed">Completed</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} /></div>
        </div></div>
        <div className="modal-actions"><button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button><button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h2>Customer Follow-Up CRM</h2><div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Follow-Up</button></div></div>
      <div className="data-table-container"><table className="data-table"><thead><tr><th>Customer</th><th>Type</th><th>Direction</th><th>Subject</th><th>Outcome</th><th>Sentiment</th><th>Priority</th><th>Follow-Up</th><th>Status</th></tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => handleRowClick(item)}>
            <td><strong>{item.customer_name}</strong></td>
            <td>{item.contact_type}</td>
            <td>{item.direction}</td>
            <td>{item.subject || '—'}</td>
            <td>{item.outcome || '—'}</td>
            <td style={{ color: getSentimentColor(item.sentiment) }}>{item.sentiment || '—'}</td>
            <td style={{ color: getPriorityColor(item.priority) }}>{item.priority}</td>
            <td>{item.follow_up_date ? new Date(item.follow_up_date).toLocaleDateString() : '—'}</td>
            <td><span className={`status-badge status-${item.status === 'overdue' ? 'lost' : item.status}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{selected.customer_name} - {selected.contact_type}</h3><button className="modal-close" onClick={() => setSelected(null)}>&times;</button></div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{selected.customer_name}</div></div>
              <div className="detail-item"><div className="detail-label">Contact Type</div><div className="detail-value">{selected.contact_type}</div></div>
              <div className="detail-item"><div className="detail-label">Direction</div><div className="detail-value">{selected.direction}</div></div>
              <div className="detail-item"><div className="detail-label">Subject</div><div className="detail-value">{selected.subject || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Outcome</div><div className="detail-value">{selected.outcome || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Sentiment</div><div className="detail-value" style={{ color: getSentimentColor(selected.sentiment) }}>{selected.sentiment || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Priority</div><div className="detail-value" style={{ color: getPriorityColor(selected.priority) }}>{selected.priority}</div></div>
              <div className="detail-item"><div className="detail-label">Sales Person</div><div className="detail-value">{selected.sales_person || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Follow-Up Date</div><div className="detail-value">{selected.follow_up_date ? new Date(selected.follow_up_date).toLocaleString() : '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status === 'overdue' ? 'lost' : selected.status}`}>{selected.status}</span></div></div>
            </div>
            {selected.notes && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>}
            <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} />
          </div>
          <div className="modal-actions"><button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Follow-Up Strategy</button><button className="btn-secondary" onClick={handleEdit}>Edit</button><button className="btn-danger" onClick={handleDelete}>Delete</button></div>
        </div></div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default FollowupsPage;
