import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, aiAnalyzeCampaign } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const empty = { name: '', campaign_type: 'Digital Ads', channel: '', target_audience: '', start_date: '', end_date: '', budget: 0, spent: 0, leads_generated: 0, deals_closed: 0, revenue_attributed: 0, impressions: 0, clicks: 0, conversion_rate: 0, status: 'draft', notes: '' };

function CampaignsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(empty);
  const [showNew, setShowNew] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { setItems(await getCampaigns()); } catch (e) { console.error(e); } };
  const handleRowClick = (item) => { setSelected(item); setEditing(false); setAiResult(null); setAiError(null); };
  const handleEdit = () => { setFormData({ ...selected }); setEditing(true); };
  const handleDelete = async () => { if (!window.confirm('Delete?')) return; await deleteCampaign(selected.id); setSelected(null); loadData(); };
  const handleNew = () => { setFormData({ ...empty }); setShowNew(true); setSelected(null); };
  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleSave = async () => { try { if (editing && selected) await updateCampaign(selected.id, formData); else await createCampaign(formData); setSelected(null); setShowNew(false); setEditing(false); loadData(); } catch (e) { alert(e.message); } };
  const handleAI = async () => { setAiLoading(true); setAiError(null); setAiResult(null); try { setAiResult(await aiAnalyzeCampaign(selected.id)); } catch (e) { setAiError(e.message); } finally { setAiLoading(false); } };

  const getRoiColor = (roi) => { if (!roi) return '#64748b'; const r = parseFloat(roi); if (r > 1000) return '#4ade80'; if (r > 0) return '#60a5fa'; return '#f87171'; };

  const renderForm = () => (
    <div className="modal-overlay" onClick={() => { setShowNew(false); setEditing(false); }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{editing ? 'Edit Campaign' : 'New Marketing Campaign'}</h3><button className="modal-close" onClick={() => { setShowNew(false); setEditing(false); }}>&times;</button></div>
        <div className="modal-body"><div className="edit-form">
          <div className="form-group full-width"><label>Campaign Name</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Type</label><select name="campaign_type" value={formData.campaign_type} onChange={handleChange}><option>Digital Ads</option><option>Email</option><option>Social Media</option><option>TV/Radio</option><option>Direct Mail</option><option>Event</option><option>Referral Program</option></select></div>
          <div className="form-group"><label>Channel</label><input name="channel" value={formData.channel} onChange={handleChange} placeholder="e.g. Facebook, Google Ads" /></div>
          <div className="form-group"><label>Target Audience</label><input name="target_audience" value={formData.target_audience} onChange={handleChange} /></div>
          <div className="form-group"><label>Start Date</label><input name="start_date" type="date" value={formData.start_date} onChange={handleChange} required /></div>
          <div className="form-group"><label>End Date</label><input name="end_date" type="date" value={formData.end_date || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Budget</label><input name="budget" type="number" value={formData.budget} onChange={handleChange} /></div>
          <div className="form-group"><label>Spent</label><input name="spent" type="number" value={formData.spent} onChange={handleChange} /></div>
          <div className="form-group"><label>Leads Generated</label><input name="leads_generated" type="number" value={formData.leads_generated} onChange={handleChange} /></div>
          <div className="form-group"><label>Deals Closed</label><input name="deals_closed" type="number" value={formData.deals_closed} onChange={handleChange} /></div>
          <div className="form-group"><label>Revenue Attributed</label><input name="revenue_attributed" type="number" value={formData.revenue_attributed} onChange={handleChange} /></div>
          <div className="form-group"><label>Impressions</label><input name="impressions" type="number" value={formData.impressions} onChange={handleChange} /></div>
          <div className="form-group"><label>Clicks</label><input name="clicks" type="number" value={formData.clicks} onChange={handleChange} /></div>
          <div className="form-group"><label>Conversion Rate (%)</label><input name="conversion_rate" type="number" step="0.01" value={formData.conversion_rate} onChange={handleChange} /></div>
          <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleChange}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group full-width"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} /></div>
        </div></div>
        <div className="modal-actions"><button className="btn-primary" style={{ width: 'auto' }} onClick={handleSave}>Save</button><button className="btn-secondary" onClick={() => { setShowNew(false); setEditing(false); }}>Cancel</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header"><h2>Marketing Campaigns</h2><div className="page-actions"><button className="btn-new" onClick={handleNew}>+ New Campaign</button></div></div>
      <div className="data-table-container"><table className="data-table"><thead><tr><th>Campaign</th><th>Type</th><th>Channel</th><th>Budget</th><th>Spent</th><th>Leads</th><th>Deals</th><th>Revenue</th><th>ROI</th><th>Status</th></tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => handleRowClick(item)}>
            <td><strong>{item.name}</strong></td>
            <td>{item.campaign_type}</td>
            <td>{item.channel || '—'}</td>
            <td>${parseInt(item.budget).toLocaleString()}</td>
            <td>${parseInt(item.spent).toLocaleString()}</td>
            <td>{item.leads_generated}</td>
            <td>{item.deals_closed}</td>
            <td style={{ color: '#4ade80' }}>${parseInt(item.revenue_attributed).toLocaleString()}</td>
            <td style={{ color: getRoiColor(item.roi) }}>{parseFloat(item.roi).toFixed(0)}%</td>
            <td><span className={`status-badge status-${item.status === 'paused' ? 'pending' : item.status === 'draft' ? 'new' : item.status}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>{selected.name}</h3><button className="modal-close" onClick={() => setSelected(null)}>&times;</button></div>
          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Type</div><div className="detail-value">{selected.campaign_type}</div></div>
              <div className="detail-item"><div className="detail-label">Channel</div><div className="detail-value">{selected.channel || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Target</div><div className="detail-value">{selected.target_audience}</div></div>
              <div className="detail-item"><div className="detail-label">Dates</div><div className="detail-value">{selected.start_date} - {selected.end_date || 'Ongoing'}</div></div>
              <div className="detail-item"><div className="detail-label">Budget</div><div className="detail-value">${parseInt(selected.budget).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Spent</div><div className="detail-value">${parseInt(selected.spent).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Leads</div><div className="detail-value">{selected.leads_generated}</div></div>
              <div className="detail-item"><div className="detail-label">Deals Closed</div><div className="detail-value">{selected.deals_closed}</div></div>
              <div className="detail-item"><div className="detail-label">Revenue</div><div className="detail-value" style={{ color: '#4ade80' }}>${parseInt(selected.revenue_attributed).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Impressions</div><div className="detail-value">{parseInt(selected.impressions).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Clicks</div><div className="detail-value">{parseInt(selected.clicks).toLocaleString()}</div></div>
              <div className="detail-item"><div className="detail-label">Conversion</div><div className="detail-value">{selected.conversion_rate}%</div></div>
              <div className="detail-item"><div className="detail-label">ROI</div><div className="detail-value" style={{ color: getRoiColor(selected.roi), fontSize: 18 }}>{parseFloat(selected.roi).toFixed(0)}%</div></div>
              <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status === 'paused' ? 'pending' : selected.status === 'draft' ? 'new' : selected.status}`}>{selected.status}</span></div></div>
            </div>
            {selected.notes && <div className="detail-item" style={{ marginBottom: 12 }}><div className="detail-label">Notes</div><div className="detail-value">{selected.notes}</div></div>}
            <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} />
          </div>
          <div className="modal-actions"><button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Campaign Analysis</button><button className="btn-secondary" onClick={handleEdit}>Edit</button><button className="btn-danger" onClick={handleDelete}>Delete</button></div>
        </div></div>
      )}
      {(showNew || editing) && renderForm()}
    </div>
  );
}

export default CampaignsPage;
