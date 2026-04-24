import React, { useState, useEffect } from 'react';
import { getDeals, createDeal, updateDeal, deleteDeal, aiAnalyzeDeal, getCustomers, getInventory } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyDeal = {
  customer_id: '', vehicle_id: '', trade_in_id: '', sale_price: 0, trade_in_value: 0,
  fni_total: 0, status: 'pending', sales_person: ''
};

function DealsPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyDeal);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      const [deals, custs, vehs] = await Promise.all([getDeals(), getCustomers(), getInventory()]);
      setItems(deals); setCustomers(custs); setVehicles(vehs);
    } catch (e) { console.error(e); }
  };

  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete this deal?')) return; await deleteDeal(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...emptyDeal }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSave = async () => {
    try {
      if (editing && selected) await updateDeal(selected.id, formData);
      else await createDeal(formData);
      setSelected(null); setShowNew(false); setEditing(false); loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiAnalyzeDeal(selected.id)); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Deal' : 'Add New Deal'}</h3>
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
            <div className="form-group"><label>Vehicle</label>
              <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange}>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Sale Price</label><input name="sale_price" type="number" value={formData.sale_price} onChange={handleChange} /></div>
            <div className="form-group"><label>Trade-In Value</label><input name="trade_in_value" type="number" value={formData.trade_in_value} onChange={handleChange} /></div>
            <div className="form-group"><label>F&I Total</label><input name="fni_total" type="number" value={formData.fni_total} onChange={handleChange} /></div>
            <div className="form-group"><label>Sales Person</label><input name="sales_person" value={formData.sales_person} onChange={handleChange} /></div>
            <div className="form-group"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Pending</option><option value="financing">Financing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
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
        <h2>Deal Management</h2>
        <div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Deal</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Vehicle</th><th>Sale Price</th><th>Trade-In</th><th>F&I</th><th>Total Value</th><th>Margin</th><th>Sales Person</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.customer_name || '—'}</strong></td>
                <td>{item.vehicle_name || '—'}</td>
                <td>${parseInt(item.sale_price).toLocaleString()}</td>
                <td>${parseInt(item.trade_in_value).toLocaleString()}</td>
                <td>${parseInt(item.fni_total).toLocaleString()}</td>
                <td style={{ fontWeight: 600, color: '#4ade80' }}>${parseInt(item.total_deal_value).toLocaleString()}</td>
                <td>{parseFloat(item.profit_margin).toFixed(1)}%</td>
                <td>{item.sales_person}</td>
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
              <h3>Deal #{selected.id}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{selected.customer_name || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Vehicle</div><div className="detail-value">{selected.vehicle_name || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Sale Price</div><div className="detail-value">${parseInt(selected.sale_price).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Trade-In Value</div><div className="detail-value">${parseInt(selected.trade_in_value).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">F&I Total</div><div className="detail-value">${parseInt(selected.fni_total).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Total Deal Value</div><div className="detail-value" style={{ color: '#4ade80' }}>${parseInt(selected.total_deal_value).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Profit Margin</div><div className="detail-value">{parseFloat(selected.profit_margin).toFixed(1)}%</div></div>
                <div className="detail-item"><div className="detail-label">Sales Person</div><div className="detail-value">{selected.sales_person}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
              </div>
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="deal" />
            </div>
            <div className="modal-actions">
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Deal Analysis</button>
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

export default DealsPage;
