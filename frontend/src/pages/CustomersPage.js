import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, aiMatchCustomer } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyCustomer = {
  first_name: '', last_name: '', email: '', phone: '', budget_min: 0, budget_max: 0,
  preferred_make: '', preferred_type: 'Sedan', credit_score_range: '', financing_needed: false, status: 'active'
};

function CustomersPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyCustomer);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setItems(await getCustomers()); } catch (e) { console.error(e); } };

  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete this customer?')) return; await deleteCustomer(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...emptyCustomer }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  const handleSave = async () => {
    try {
      if (editing && selected) await updateCustomer(selected.id, formData);
      else await createCustomer(formData);
      setSelected(null); setShowNew(false); setEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiMatchCustomer(selected.id)); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group"><label>First Name</label><input name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>Last Name</label><input name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
            <div className="form-group"><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} /></div>
            <div className="form-group"><label>Phone</label><input name="phone" value={formData.phone} onChange={handleChange} /></div>
            <div className="form-group"><label>Budget Min</label><input name="budget_min" type="number" value={formData.budget_min} onChange={handleChange} /></div>
            <div className="form-group"><label>Budget Max</label><input name="budget_max" type="number" value={formData.budget_max} onChange={handleChange} /></div>
            <div className="form-group"><label>Preferred Make</label><input name="preferred_make" value={formData.preferred_make} onChange={handleChange} /></div>
            <div className="form-group"><label>Preferred Type</label>
              <select name="preferred_type" value={formData.preferred_type} onChange={handleChange}>
                <option>Sedan</option><option>SUV</option><option>Truck</option><option>Coupe</option><option>Van</option><option>Any</option>
              </select>
            </div>
            <div className="form-group"><label>Credit Score Range</label><input name="credit_score_range" value={formData.credit_score_range} onChange={handleChange} placeholder="e.g. 720-780" /></div>
            <div className="form-group"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="purchased">Purchased</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input name="financing_needed" type="checkbox" checked={formData.financing_needed} onChange={handleChange} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Financing Needed</label>
            </div>
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
        <h2>Customer-Vehicle Matching</h2>
        <div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Customer</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Budget</th><th>Preferred</th><th>Credit</th><th>Financing</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.first_name} {item.last_name}</strong></td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>${parseInt(item.budget_min).toLocaleString()} - ${parseInt(item.budget_max).toLocaleString()}</td>
                <td>{item.preferred_make} {item.preferred_type}</td>
                <td>{item.credit_score_range}</td>
                <td>{item.financing_needed ? 'Yes' : 'No'}</td>
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
              <h3>{selected.first_name} {selected.last_name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{selected.email}</div></div>
                <div className="detail-item"><div className="detail-label">Phone</div><div className="detail-value">{selected.phone}</div></div>
                <div className="detail-item"><div className="detail-label">Budget Range</div><div className="detail-value">${parseInt(selected.budget_min).toLocaleString()} - ${parseInt(selected.budget_max).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Preferred Make</div><div className="detail-value">{selected.preferred_make}</div></div>
                <div className="detail-item"><div className="detail-label">Preferred Type</div><div className="detail-value">{selected.preferred_type}</div></div>
                <div className="detail-item"><div className="detail-label">Credit Score</div><div className="detail-value">{selected.credit_score_range}</div></div>
                <div className="detail-item"><div className="detail-label">Financing</div><div className="detail-value">{selected.financing_needed ? 'Yes' : 'No'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
              </div>
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="matching" />
            </div>
            <div className="modal-actions">
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Vehicle Match</button>
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

export default CustomersPage;
