import React, { useState, useEffect } from 'react';
import { getServiceAppointments, createServiceAppointment, updateServiceAppointment, deleteServiceAppointment, aiAnalyzeService, getCustomers } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const empty = { customer_id: '', vehicle_description: '', service_type: 'Oil Change', scheduled_date: '', estimated_duration: 60, assigned_technician: '', mileage_at_service: 0, description: '', parts_cost: 0, labor_cost: 0, status: 'scheduled' };

function ServicePage() {
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
  const loadData = async () => { try { const [a, c] = await Promise.all([getServiceAppointments(), getCustomers()]); setItems(a); setCustomers(c); } catch (e) { console.error(e); } };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected, scheduled_date: selected.scheduled_date?.slice(0, 16) }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete?')) return; await deleteServiceAppointment(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...empty }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleSave = async () => { try { if (editing && selected) await updateServiceAppointment(selected.id, formData); else await createServiceAppointment(formData); setSelected(null); setShowNew(false); setEditing(false); loadData(); } catch (e) { alert(e.message); } };
  const handleAI = async () => { setAiLoading(true); setAiError(null); setAiResult(null); try { setAiResult(await aiAnalyzeService(selected.id)); } catch (e) { setAiError(e.message); } finally { setAiLoading(false); } };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Appointment' : 'New Service Appointment'}</h3><button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button></div>
        <div className="modal-body"><div className="edit-form">
          <div className="form-group"><label>Customer</label><select name="customer_id" value={formData.customer_id} onChange={handleChange}><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></div>
          <div className="form-group"><label>Vehicle Description</label><input name="vehicle_description" value={formData.vehicle_description} onChange={handleChange} required placeholder="e.g. 2024 Toyota Camry" /></div>
          <div className="form-group"><label>Service Type</label><select name="service_type" value={formData.service_type} onChange={handleChange}><option>Oil Change</option><option>Brake Service</option><option>Tire Rotation</option><option>Major Service</option><option>Diagnostic</option><option>AC Repair</option><option>Transmission Service</option><option>Battery Replacement</option><option>Alignment</option><option>Recall Service</option><option>Suspension Repair</option><option>Other</option></select></div>
          <div className="form-group"><label>Scheduled Date</label><input name="scheduled_date" type="datetime-local" value={formData.scheduled_date} onChange={handleChange} required /></div>
          <div className="form-group"><label>Duration (min)</label><input name="estimated_duration" type="number" value={formData.estimated_duration} onChange={handleChange} /></div>
          <div className="form-group"><label>Technician</label><input name="assigned_technician" value={formData.assigned_technician} onChange={handleChange} /></div>
          <div className="form-group"><label>Mileage</label><input name="mileage_at_service" type="number" value={formData.mileage_at_service} onChange={handleChange} /></div>
          <div className="form-group"><label>Parts Cost</label><input name="parts_cost" type="number" value={formData.parts_cost} onChange={handleChange} /></div>
          <div className="form-group"><label>Labor Cost</label><input name="labor_cost" type="number" value={formData.labor_cost} onChange={handleChange} /></div>
          <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group full-width"><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} /></div>
        </div></div>
        <div className="modal-actions"><button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button><button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h2>Service & Maintenance</h2><div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Appointment</button></div></div>
      <div className="data-table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Service</th><th>Customer</th><th>Date</th><th>Technician</th><th>Cost</th><th>Status</th></tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => handleRowClick(item)}>
            <td><strong>{item.vehicle_description}</strong></td>
            <td>{item.service_type}</td>
            <td>{item.customer_name || '—'}</td>
            <td>{new Date(item.scheduled_date).toLocaleDateString()}</td>
            <td>{item.assigned_technician || '—'}</td>
            <td>${parseInt(item.total_cost).toLocaleString()}</td>
            <td><span className={`status-badge status-${item.status?.replace(' ', '_')}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{selected.vehicle_description} - {selected.service_type}</h3><button className="modal-close" onClick={() => setSelected(null)}>&times;</button></div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{selected.customer_name || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Service Type</div><div className="detail-value">{selected.service_type}</div></div>
              <div className="detail-item"><div className="detail-label">Scheduled</div><div className="detail-value">{new Date(selected.scheduled_date).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Duration</div><div className="detail-value">{selected.estimated_duration} min</div></div>
              <div className="detail-item"><div className="detail-label">Technician</div><div className="detail-value">{selected.assigned_technician || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Mileage</div><div className="detail-value">{selected.mileage_at_service ? parseInt(selected.mileage_at_service).toLocaleString() : '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Parts</div><div className="detail-value">${parseInt(selected.parts_cost).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Labor</div><div className="detail-value">${parseInt(selected.labor_cost).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Total Cost</div><div className="detail-value" style={{ color: '#4ade80' }}>${parseInt(selected.total_cost).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
            </div>
            {selected.description && <div className="detail-item" style={{ marginBottom: 16 }}><div className="detail-label">Description</div><div className="detail-value">{selected.description}</div></div>}
            <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} />
          </div>
          <div className="modal-actions"><button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Service Analysis</button><button className="btn-secondary" onClick={handleEdit}>Edit</button><button className="btn-danger" onClick={handleDelete}>Delete</button></div>
        </div></div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default ServicePage;
