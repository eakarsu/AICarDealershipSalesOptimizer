import React, { useState, useEffect } from 'react';
import { getInspections, createInspection, updateInspection, deleteInspection, aiAnalyzeInspection, getInventory } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const ratings = ['Excellent', 'Good', 'Fair', 'Poor', 'Fail'];
const empty = { vehicle_id: '', inspector_name: '', inspection_type: 'Pre-Sale', engine_rating: 'Good', transmission_rating: 'Good', brakes_rating: 'Good', suspension_rating: 'Good', tires_rating: 'Good', exterior_rating: 'Good', interior_rating: 'Good', electrical_rating: 'Good', overall_score: 80, issues_found: '', reconditioning_cost: 0, passed: true, notes: '' };

function InspectionsPage() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(empty);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const [a, v] = await Promise.all([getInspections(), getInventory()]); setItems(a); setVehicles(v); } catch (e) { console.error(e); } };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete?')) return; await deleteInspection(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...empty }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleSave = async () => { try { if (editing && selected) await updateInspection(selected.id, formData); else await createInspection(formData); setSelected(null); setShowNew(false); setEditing(false); loadData(); } catch (e) { alert(e.message); } };
  const handleAI = async () => { setAiLoading(true); setAiError(null); setAiResult(null); try { setAiResult(await aiAnalyzeInspection(selected.id)); } catch (e) { setAiError(e.message); } finally { setAiLoading(false); } };

  const getRatingColor = (r) => r === 'Excellent' ? '#4ade80' : r === 'Good' ? '#60a5fa' : r === 'Fair' ? '#fbbf24' : '#f87171';

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Inspection' : 'New Vehicle Inspection'}</h3><button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button></div>
        <div className="modal-body"><div className="edit-form">
          <div className="form-group"><label>Vehicle</label><select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange}><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}</select></div>
          <div className="form-group"><label>Inspector</label><input name="inspector_name" value={formData.inspector_name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Type</label><select name="inspection_type" value={formData.inspection_type} onChange={handleChange}><option>Pre-Sale</option><option>Trade-In</option><option>Certified Pre-Owned</option><option>Safety</option><option>Emissions</option></select></div>
          <div className="form-group"><label>Overall Score (0-100)</label><input name="overall_score" type="number" min="0" max="100" value={formData.overall_score} onChange={handleChange} /></div>
          {['engine', 'transmission', 'brakes', 'suspension', 'tires', 'exterior', 'interior', 'electrical'].map(area => (
            <div className="form-group" key={area}><label>{area.charAt(0).toUpperCase() + area.slice(1)}</label><select name={`${area}_rating`} value={formData[`${area}_rating`]} onChange={handleChange}>{ratings.map(r => <option key={r}>{r}</option>)}</select></div>
          ))}
          <div className="form-group"><label>Reconditioning Cost</label><input name="reconditioning_cost" type="number" value={formData.reconditioning_cost} onChange={handleChange} /></div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input name="passed" type="checkbox" checked={formData.passed} onChange={handleChange} style={{ width: 'auto' }} /><label style={{ margin: 0 }}>Passed</label></div>
          <div className="form-group full-width"><label>Issues Found</label><textarea name="issues_found" value={formData.issues_found || ''} onChange={handleChange} /></div>
          <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} /></div>
        </div></div>
        <div className="modal-actions"><button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button><button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h2>Vehicle Inspections</h2><div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Inspection</button></div></div>
      <div className="data-table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Type</th><th>Inspector</th><th>Score</th><th>Engine</th><th>Brakes</th><th>Tires</th><th>Recon Cost</th><th>Passed</th></tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => handleRowClick(item)}>
            <td><strong>{item.vehicle_name || `Vehicle #${item.vehicle_id}`}</strong></td>
            <td>{item.inspection_type}</td>
            <td>{item.inspector_name}</td>
            <td><span style={{ color: item.overall_score >= 80 ? '#4ade80' : item.overall_score >= 60 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>{item.overall_score}</span></td>
            <td style={{ color: getRatingColor(item.engine_rating) }}>{item.engine_rating}</td>
            <td style={{ color: getRatingColor(item.brakes_rating) }}>{item.brakes_rating}</td>
            <td style={{ color: getRatingColor(item.tires_rating) }}>{item.tires_rating}</td>
            <td>${parseInt(item.reconditioning_cost).toLocaleString()}</td>
            <td><span className={`status-badge ${item.passed ? 'status-active' : 'status-lost'}`}>{item.passed ? 'Pass' : 'Fail'}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{selected.vehicle_name || 'Vehicle Inspection'} - {selected.inspection_type}</h3><button className="modal-close" onClick={() => setSelected(null)}>&times;</button></div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Inspector</div><div className="detail-value">{selected.inspector_name}</div></div>
              <div className="detail-item"><div className="detail-label">Overall Score</div><div className="detail-value" style={{ color: selected.overall_score >= 80 ? '#4ade80' : '#fbbf24', fontSize: 20 }}>{selected.overall_score}/100</div></div>
              {['engine', 'transmission', 'brakes', 'suspension', 'tires', 'exterior', 'interior', 'electrical'].map(area => (
                <div className="detail-item" key={area}><div className="detail-label">{area.charAt(0).toUpperCase() + area.slice(1)}</div><div className="detail-value" style={{ color: getRatingColor(selected[`${area}_rating`]) }}>{selected[`${area}_rating`]}</div></div>
              ))}
              <div className="detail-item"><div className="detail-label">Reconditioning</div><div className="detail-value">${parseInt(selected.reconditioning_cost).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Result</div><div className="detail-value"><span className={`status-badge ${selected.passed ? 'status-active' : 'status-lost'}`}>{selected.passed ? 'Passed' : 'Failed'}</span></div></div>
            </div>
            {selected.issues_found && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Issues Found</div><div className="detail-value">{selected.issues_found}</div></div>}
            {selected.notes && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>}
            <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} />
          </div>
          <div className="modal-actions"><button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Inspection Analysis</button><button className="btn-secondary" onClick={handleEdit}>Edit</button><button className="btn-danger" onClick={handleDelete}>Delete</button></div>
        </div></div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default InspectionsPage;
