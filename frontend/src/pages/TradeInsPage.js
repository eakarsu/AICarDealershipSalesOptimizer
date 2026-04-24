import React, { useState, useEffect } from 'react';
import { getTradeIns, createTradeIn, updateTradeIn, deleteTradeIn, aiValuateTradeIn, getCustomers } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyTradeIn = {
  customer_id: '', make: '', model: '', year: 2020, mileage: 0, condition: 'Good', photo_url: '', notes: '', status: 'pending'
};

function TradeInsPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyTradeIn);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      const [tradeIns, custs] = await Promise.all([getTradeIns(), getCustomers()]);
      setItems(tradeIns);
      setCustomers(custs);
    } catch (e) { console.error(e); }
  };

  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete this trade-in?')) return; await deleteTradeIn(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...emptyTradeIn }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSave = async () => {
    try {
      if (editing && selected) await updateTradeIn(selected.id, formData);
      else await createTradeIn(formData);
      setSelected(null); setShowNew(false); setEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiValuateTradeIn(selected.id)); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Trade-In' : 'Add New Trade-In'}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group"><label>Customer</label>
              <select name="customer_id" value={formData.customer_id} onChange={handleChange}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Make</label><input name="make" value={formData.make} onChange={handleChange} required /></div>
            <div className="form-group"><label>Model</label><input name="model" value={formData.model} onChange={handleChange} required /></div>
            <div className="form-group"><label>Year</label><input name="year" type="number" value={formData.year} onChange={handleChange} /></div>
            <div className="form-group"><label>Mileage</label><input name="mileage" type="number" value={formData.mileage} onChange={handleChange} /></div>
            <div className="form-group"><label>Condition</label>
              <select name="condition" value={formData.condition} onChange={handleChange}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Pending</option><option value="appraised">Appraised</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
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
        <h2>Trade-In Valuation</h2>
        <div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Trade-In</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Vehicle</th><th>Year</th><th>Customer</th><th>Mileage</th><th>Condition</th><th>AI Value</th><th>Market Value</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.make} {item.model}</strong></td>
                <td>{item.year}</td>
                <td>{item.customer_name || '—'}</td>
                <td>{parseInt(item.mileage).toLocaleString()}</td>
                <td>{item.condition}</td>
                <td>{item.ai_valuation ? `$${parseInt(item.ai_valuation).toLocaleString()}` : '—'}</td>
                <td>{item.market_value ? `$${parseInt(item.market_value).toLocaleString()}` : '—'}</td>
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
              <h3>{selected.year} {selected.make} {selected.model}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{selected.customer_name || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Mileage</div><div className="detail-value">{parseInt(selected.mileage).toLocaleString()} mi</div></div>
                <div className="detail-item"><div className="detail-label">Condition</div><div className="detail-value">{selected.condition}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="detail-label">AI Valuation</div><div className="detail-value">{selected.ai_valuation ? `$${parseInt(selected.ai_valuation).toLocaleString()}` : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Market Value</div><div className="detail-value">{selected.market_value ? `$${parseInt(selected.market_value).toLocaleString()}` : '—'}</div></div>
              </div>
              {selected.notes && (
                <div className="detail-item" style={{ marginBottom: 16 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>
              )}
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="valuation" />
            </div>
            <div className="modal-actions">
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Valuation</button>
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

export default TradeInsPage;
