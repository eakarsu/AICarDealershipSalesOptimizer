import React, { useState, useEffect } from 'react';
import { getInventory, createVehicle, updateVehicle, deleteVehicle, aiPriceAnalysis } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const emptyVehicle = {
  vin: '', make: '', model: '', year: 2024, trim: '', color: '', mileage: 0,
  purchase_price: 0, listing_price: 0, condition: 'Good', body_type: 'Sedan', status: 'available'
};

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(emptyVehicle);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setItems(await getInventory()); } catch (e) { console.error(e); }
  };

  const handleRowClick = (item) => {
    setSelected(item);
    setEditing(false);
    setAiResult(null);
    setAiError(null);
  };

  const handleEdit = () => {
    setFormData({ ...selected });
    setEditing(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this vehicle?')) return;
    await deleteVehicle(selected.id);
    setSelected(null);
    loadData();
  };

  const handleSave = async () => {
    try {
      if (editing && selected) {
        await updateVehicle(selected.id, formData);
      } else {
        await createVehicle(formData);
      }
      setSelected(null);
      setShowNew(false);
      setEditing(false);
      loadData();
    } catch (e) { alert(e.message); }
  };

  const handleAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await aiPriceAnalysis(selected.id);
      setAiResult(result);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleNew = () => {
    setFormData({ ...emptyVehicle });
    setShowNew(true);
    setSelected(null);
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); setSelected(editing ? selected : null); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group"><label>VIN</label><input name="vin" value={formData.vin} onChange={handleChange} /></div>
            <div className="form-group"><label>Make</label><input name="make" value={formData.make} onChange={handleChange} required /></div>
            <div className="form-group"><label>Model</label><input name="model" value={formData.model} onChange={handleChange} required /></div>
            <div className="form-group"><label>Year</label><input name="year" type="number" value={formData.year} onChange={handleChange} /></div>
            <div className="form-group"><label>Trim</label><input name="trim" value={formData.trim} onChange={handleChange} /></div>
            <div className="form-group"><label>Color</label><input name="color" value={formData.color} onChange={handleChange} /></div>
            <div className="form-group"><label>Mileage</label><input name="mileage" type="number" value={formData.mileage} onChange={handleChange} /></div>
            <div className="form-group"><label>Body Type</label>
              <select name="body_type" value={formData.body_type} onChange={handleChange}>
                <option>Sedan</option><option>SUV</option><option>Truck</option><option>Coupe</option><option>Van</option><option>Wagon</option>
              </select>
            </div>
            <div className="form-group"><label>Purchase Price</label><input name="purchase_price" type="number" value={formData.purchase_price} onChange={handleChange} /></div>
            <div className="form-group"><label>Listing Price</label><input name="listing_price" type="number" value={formData.listing_price} onChange={handleChange} /></div>
            <div className="form-group"><label>Condition</label>
              <select name="condition" value={formData.condition} onChange={handleChange}>
                <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="available">Available</option><option value="pending">Pending</option><option value="sold">Sold</option>
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
        <h2>Inventory Pricing</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={handleNew}>+ New Vehicle</button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Year</th><th>Color</th><th>Mileage</th><th>Purchase</th><th>Listing</th><th>AI Price</th><th>Days</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td><strong>{item.make} {item.model}</strong> {item.trim && <span style={{ color: '#64748b' }}>{item.trim}</span>}</td>
                <td>{item.year}</td>
                <td>{item.color}</td>
                <td>{parseInt(item.mileage).toLocaleString()}</td>
                <td>${parseInt(item.purchase_price).toLocaleString()}</td>
                <td>${parseInt(item.listing_price).toLocaleString()}</td>
                <td>{item.ai_suggested_price ? `$${parseInt(item.ai_suggested_price).toLocaleString()}` : '—'}</td>
                <td>{item.days_on_lot}</td>
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
              <h3>{selected.year} {selected.make} {selected.model} {selected.trim}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">VIN</div><div className="detail-value">{selected.vin || '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Body Type</div><div className="detail-value">{selected.body_type}</div></div>
                <div className="detail-item"><div className="detail-label">Color</div><div className="detail-value">{selected.color}</div></div>
                <div className="detail-item"><div className="detail-label">Mileage</div><div className="detail-value">{parseInt(selected.mileage).toLocaleString()} mi</div></div>
                <div className="detail-item"><div className="detail-label">Condition</div><div className="detail-value">{selected.condition}</div></div>
                <div className="detail-item"><div className="detail-label">Days on Lot</div><div className="detail-value">{selected.days_on_lot}</div></div>
                <div className="detail-item"><div className="detail-label">Purchase Price</div><div className="detail-value">${parseInt(selected.purchase_price).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Listing Price</div><div className="detail-value">${parseInt(selected.listing_price).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">AI Suggested Price</div><div className="detail-value">{selected.ai_suggested_price ? `$${parseInt(selected.ai_suggested_price).toLocaleString()}` : '—'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
              </div>
              <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="pricing" />
            </div>
            <div className="modal-actions">
              <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Price Analysis</button>
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

export default InventoryPage;
