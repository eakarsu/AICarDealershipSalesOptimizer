import React, { useState, useEffect } from 'react';
import { getTestDrives, createTestDrive, updateTestDrive, deleteTestDrive, aiAnalyzeTestDrive, getCustomers, getInventory } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const empty = { customer_id: '', vehicle_id: '', customer_name: '', vehicle_description: '', scheduled_date: '', duration_minutes: 30, sales_person: '', route_type: 'Mixed', license_verified: false, insurance_verified: false, pre_drive_interest: 5, post_drive_interest: '', feedback: '', outcome: 'pending', notes: '', status: 'scheduled' };

function TestDrivesPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(empty);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const [t, c, v] = await Promise.all([getTestDrives(), getCustomers(), getInventory()]); setItems(t); setCustomers(c); setVehicles(v); } catch (e) { console.error(e); } };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected, scheduled_date: selected.scheduled_date?.slice(0, 16) }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete?')) return; await deleteTestDrive(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...empty }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };

  const handleCustomerSelect = (e) => {
    const cid = e.target.value;
    const c = customers.find(x => x.id === parseInt(cid));
    setFormData(prev => ({ ...prev, customer_id: cid, customer_name: c ? `${c.first_name} ${c.last_name}` : '' }));
  };
  const handleVehicleSelect = (e) => {
    const vid = e.target.value;
    const v = vehicles.find(x => x.id === parseInt(vid));
    setFormData(prev => ({ ...prev, vehicle_id: vid, vehicle_description: v ? `${v.year} ${v.make} ${v.model} ${v.trim || ''}` : '' }));
  };

  const handleSave = async () => { try { if (editing && selected) await updateTestDrive(selected.id, formData); else await createTestDrive(formData); setSelected(null); setShowNew(false); setEditing(false); loadData(); } catch (e) { alert(e.message); } };
  const handleAI = async () => { setAiLoading(true); setAiError(null); setAiResult(null); try { setAiResult(await aiAnalyzeTestDrive(selected.id)); } catch (e) { setAiError(e.message); } finally { setAiLoading(false); } };

  const getInterestColor = (score) => { if (!score) return '#64748b'; if (score >= 8) return '#4ade80'; if (score >= 5) return '#fbbf24'; return '#f87171'; };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Test Drive' : 'Schedule Test Drive'}</h3><button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button></div>
        <div className="modal-body"><div className="edit-form">
          <div className="form-group"><label>Customer</label><select name="customer_id" value={formData.customer_id} onChange={handleCustomerSelect}><option value="">Select</option>{customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></div>
          <div className="form-group"><label>Vehicle</label><select name="vehicle_id" value={formData.vehicle_id} onChange={handleVehicleSelect}><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}</select></div>
          <div className="form-group"><label>Scheduled Date</label><input name="scheduled_date" type="datetime-local" value={formData.scheduled_date} onChange={handleChange} required /></div>
          <div className="form-group"><label>Duration (min)</label><input name="duration_minutes" type="number" value={formData.duration_minutes} onChange={handleChange} /></div>
          <div className="form-group"><label>Sales Person</label><input name="sales_person" value={formData.sales_person} onChange={handleChange} /></div>
          <div className="form-group"><label>Route Type</label><select name="route_type" value={formData.route_type} onChange={handleChange}><option>City</option><option>Highway</option><option>Mixed</option><option>Customer Choice</option></select></div>
          <div className="form-group"><label>Pre-Drive Interest (1-10)</label><input name="pre_drive_interest" type="number" min="1" max="10" value={formData.pre_drive_interest} onChange={handleChange} /></div>
          <div className="form-group"><label>Post-Drive Interest (1-10)</label><input name="post_drive_interest" type="number" min="1" max="10" value={formData.post_drive_interest || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Outcome</label><select name="outcome" value={formData.outcome} onChange={handleChange}><option value="pending">Pending</option><option value="completed">Completed</option><option value="purchased">Purchased</option><option value="declined">Declined</option><option value="no_show">No Show</option></select></div>
          <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group" style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input name="license_verified" type="checkbox" checked={formData.license_verified} onChange={handleChange} /> License Verified</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><input name="insurance_verified" type="checkbox" checked={formData.insurance_verified} onChange={handleChange} /> Insurance Verified</label>
          </div>
          <div className="form-group full-width"><label>Feedback</label><textarea name="feedback" value={formData.feedback || ''} onChange={handleChange} /></div>
          <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} /></div>
        </div></div>
        <div className="modal-actions"><button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button><button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h2>Test Drive Scheduling</h2><div className="page-actions"><button className="btn-new" onClick={handleNew}>+ Schedule Test Drive</button></div></div>
      <div className="data-table-container"><table className="data-table"><thead><tr><th>Customer</th><th>Vehicle</th><th>Date</th><th>Sales Person</th><th>Route</th><th>Pre</th><th>Post</th><th>Outcome</th><th>Status</th></tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => handleRowClick(item)}>
            <td><strong>{item.customer_name}</strong></td>
            <td>{item.vehicle_description}</td>
            <td>{new Date(item.scheduled_date).toLocaleDateString()}</td>
            <td>{item.sales_person || '—'}</td>
            <td>{item.route_type}</td>
            <td style={{ color: getInterestColor(item.pre_drive_interest) }}>{item.pre_drive_interest || '—'}</td>
            <td style={{ color: getInterestColor(item.post_drive_interest) }}>{item.post_drive_interest || '—'}</td>
            <td><span className={`status-badge status-${item.outcome === 'purchased' ? 'completed' : item.outcome === 'declined' ? 'lost' : item.outcome === 'no_show' ? 'cancelled' : 'pending'}`}>{item.outcome}</span></td>
            <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{selected.customer_name} - {selected.vehicle_description}</h3><button className="modal-close" onClick={() => setSelected(null)}>&times;</button></div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{selected.customer_name}</div></div>
              <div className="detail-item"><div className="detail-label">Vehicle</div><div className="detail-value">{selected.vehicle_description}</div></div>
              <div className="detail-item"><div className="detail-label">Scheduled</div><div className="detail-value">{new Date(selected.scheduled_date).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Duration</div><div className="detail-value">{selected.duration_minutes} min</div></div>
              <div className="detail-item"><div className="detail-label">Sales Person</div><div className="detail-value">{selected.sales_person || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Route</div><div className="detail-value">{selected.route_type}</div></div>
              <div className="detail-item"><div className="detail-label">Pre-Drive Interest</div><div className="detail-value" style={{ color: getInterestColor(selected.pre_drive_interest), fontSize: 18 }}>{selected.pre_drive_interest || '—'}/10</div></div>
              <div className="detail-item"><div className="detail-label">Post-Drive Interest</div><div className="detail-value" style={{ color: getInterestColor(selected.post_drive_interest), fontSize: 18 }}>{selected.post_drive_interest || '—'}/10</div></div>
              <div className="detail-item"><div className="detail-label">License</div><div className="detail-value">{selected.license_verified ? 'Verified' : 'Not Verified'}</div></div>
              <div className="detail-item"><div className="detail-label">Insurance</div><div className="detail-value">{selected.insurance_verified ? 'Verified' : 'Not Verified'}</div></div>
              <div className="detail-item"><div className="detail-label">Outcome</div><div className="detail-value">{selected.outcome}</div></div>
              <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
            </div>
            {selected.feedback && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Feedback</div><div className="detail-value">{selected.feedback}</div></div>}
            {selected.notes && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>}
            <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} />
          </div>
          <div className="modal-actions"><button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Test Drive Analysis</button><button className="btn-secondary" onClick={handleEdit}>Edit</button><button className="btn-danger" onClick={handleDelete}>Delete</button></div>
        </div></div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default TestDrivesPage;
