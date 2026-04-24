import React, { useState, useEffect } from 'react';
import { getFniProducts, createFniProduct, updateFniProduct, deleteFniProduct, aiFniRecommend, getCustomers } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyProduct = {
  name: '', description: '', category: 'Warranty', base_price: 0, commission_rate: 0,
  provider: '', coverage_term: '', is_active: true
};

function FniPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyProduct);
  const [showNew, setShowNew] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCustomerId, setAiCustomerId] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      const [products, custs] = await Promise.all([getFniProducts(), getCustomers()]);
      setItems(products);
      setCustomers(custs);
    } catch (e) { console.error(e); }
  };

  const handleRowClick = (item) => { setSelected(item); setEditing(false); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete this product?')) return; await deleteFniProduct(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...emptyProduct }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  const handleSave = async () => {
    try {
      if (editing && selected) await updateFniProduct(selected.id, formData);
      else await createFniProduct(formData);
      setSelected(null); setShowNew(false); setEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    if (!aiCustomerId) { alert('Please select a customer'); return; }
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiFniRecommend(aiCustomerId)); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Product' : 'Add New F&I Product'}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group full-width"><label>Name</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="form-group full-width"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} /></div>
            <div className="form-group"><label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option>Warranty</option><option>Insurance</option><option>Protection</option><option>Security</option><option>Maintenance</option>
              </select>
            </div>
            <div className="form-group"><label>Base Price</label><input name="base_price" type="number" value={formData.base_price} onChange={handleChange} /></div>
            <div className="form-group"><label>Commission Rate (%)</label><input name="commission_rate" type="number" value={formData.commission_rate} onChange={handleChange} /></div>
            <div className="form-group"><label>Provider</label><input name="provider" value={formData.provider} onChange={handleChange} /></div>
            <div className="form-group"><label>Coverage Term</label><input name="coverage_term" value={formData.coverage_term} onChange={handleChange} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Active</label>
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
        <h2>F&I Product Recommendations</h2>
        <div className="page-actions">
          <button className="btn-ai" onClick={() => { setShowAiModal(true); setAiResult(null); setAiError(null); }}>✨ AI Recommend</button>
          <button className="btn-new" onClick={handleNew}>+ New Product</button>
        </div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Commission</th><th>Provider</th><th>Coverage</th><th>Active</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.name}</strong></td>
                <td>{item.category}</td>
                <td>${parseInt(item.base_price).toLocaleString()}</td>
                <td>{parseFloat(item.commission_rate).toFixed(0)}%</td>
                <td>{item.provider}</td>
                <td>{item.coverage_term}</td>
                <td><span className={`status-badge ${item.is_active ? 'status-active' : 'status-lost'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected.name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Category</div><div className="detail-value">{selected.category}</div></div>
                <div className="detail-item"><div className="detail-label">Base Price</div><div className="detail-value">${parseInt(selected.base_price).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Commission</div><div className="detail-value">{parseFloat(selected.commission_rate).toFixed(0)}%</div></div>
                <div className="detail-item"><div className="detail-label">Provider</div><div className="detail-value">{selected.provider}</div></div>
                <div className="detail-item"><div className="detail-label">Coverage</div><div className="detail-value">{selected.coverage_term}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge ${selected.is_active ? 'status-active' : 'status-lost'}`}>{selected.is_active ? 'Active' : 'Inactive'}</span></div></div>
              </div>
              {selected.description && (
                <div className="detail-item" style={{ marginBottom: 16 }}><div className="detail-label">Description</div><div className="detail-value">{selected.description}</div></div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleEdit}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AI F&I Recommendations</h3>
              <button className="modal-close" onClick={() => setShowAiModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Customer</label>
                <select value={aiCustomerId} onChange={e => setAiCustomerId(e.target.value)}>
                  <option value="">Select a customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading} style={{ marginBottom: 16 }}>✨ Get Recommendations</button>
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="fni" />
            </div>
          </div>
        </div>
      )}

      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default FniPage;
