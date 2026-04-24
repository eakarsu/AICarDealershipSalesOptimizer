import React, { useState, useEffect } from 'react';
import { getCommissions, createCommission, updateCommission, deleteCommission, getCommissionSummary, getStaff, getDeals } from '../services/api';

function CommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [dealsList, setDealsList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [form, setForm] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, s, st, d] = await Promise.all([
        getCommissions(),
        getCommissionSummary(),
        getStaff(),
        getDeals()
      ]);
      setCommissions(c);
      setSummary(s);
      setStaffList(st);
      setDealsList(d);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    try {
      await createCommission(form);
      setCreating(false);
      setForm({});
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async () => {
    try {
      await updateCommission(selected.id, form);
      setEditing(false);
      setSelected(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this commission record?')) return;
    try {
      await deleteCommission(id);
      setSelected(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const openCreate = () => {
    setForm({ commission_type: 'vehicle_sale', status: 'pending', commission_rate: 5 });
    setCreating(true);
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const formFields = (
    <div className="edit-form">
      <div className="form-group">
        <label>Staff Member</label>
        <select value={form.staff_id || ''} onChange={e => setForm({ ...form, staff_id: e.target.value })}>
          <option value="">Select Staff</option>
          {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Related Deal</label>
        <select value={form.deal_id || ''} onChange={e => setForm({ ...form, deal_id: e.target.value })}>
          <option value="">Select Deal (optional)</option>
          {dealsList.map(d => <option key={d.id} value={d.id}>Deal #{d.id} - ${Number(d.sale_price || 0).toLocaleString()}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Commission Type</label>
        <select value={form.commission_type || 'vehicle_sale'} onChange={e => setForm({ ...form, commission_type: e.target.value })}>
          <option value="vehicle_sale">Vehicle Sale</option>
          <option value="fni_product">F&I Product</option>
          <option value="service">Service</option>
          <option value="referral">Referral</option>
          <option value="bonus">Bonus</option>
        </select>
      </div>
      <div className="form-group">
        <label>Sale Amount ($)</label>
        <input type="number" value={form.sale_amount || ''} onChange={e => setForm({ ...form, sale_amount: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Commission Rate (%)</label>
        <input type="number" step="0.5" value={form.commission_rate || ''} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Commission Amount ($)</label>
        <input type="number" value={form.commission_amount || (form.sale_amount && form.commission_rate ? (form.sale_amount * form.commission_rate / 100).toFixed(2) : '')}
          onChange={e => setForm({ ...form, commission_amount: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Pay Period</label>
        <input value={form.pay_period || ''} placeholder="e.g. 2026-03" onChange={e => setForm({ ...form, pay_period: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="form-group full-width">
        <label>Notes</label>
        <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Commission Tracker</h2>
        <div className="page-actions">
          <button className={`btn-secondary ${viewMode === 'list' ? '' : ''}`} onClick={() => setViewMode(viewMode === 'list' ? 'summary' : 'list')}>
            {viewMode === 'list' ? 'View Summary' : 'View List'}
          </button>
          <button className="btn-new" onClick={openCreate}>+ Add Commission</button>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Commissions</div>
          <div className="stat-value">{commissions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Payout</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>${totalPending.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value" style={{ color: '#4ade80' }}>${totalPaid.toLocaleString()}</div>
        </div>
      </div>

      {viewMode === 'summary' ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Department</th>
                <th>Total Commissions</th>
                <th>Total Earned</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.staff_name}</td>
                  <td>{s.department}</td>
                  <td>{s.total_commissions}</td>
                  <td>${Number(s.total_earned).toLocaleString()}</td>
                  <td style={{ color: '#4ade80' }}>${Number(s.total_paid).toLocaleString()}</td>
                  <td style={{ color: '#fbbf24' }}>${Number(s.total_pending).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Type</th>
                <th>Sale Amount</th>
                <th>Rate</th>
                <th>Commission</th>
                <th>Pay Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}>
                  <td style={{ fontWeight: 600 }}>{c.staff_name || `Staff #${c.staff_id}`}</td>
                  <td>{c.commission_type}</td>
                  <td>${Number(c.sale_amount || 0).toLocaleString()}</td>
                  <td>{c.commission_rate}%</td>
                  <td style={{ fontWeight: 600, color: '#4ade80' }}>${Number(c.commission_amount || 0).toLocaleString()}</td>
                  <td>{c.pay_period || 'N/A'}</td>
                  <td><span className={`status-badge status-${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && !editing && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Commission Details</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Staff</div><div className="detail-value">{selected.staff_name || `Staff #${selected.staff_id}`}</div></div>
                <div className="detail-item"><div className="detail-label">Type</div><div className="detail-value">{selected.commission_type}</div></div>
                <div className="detail-item"><div className="detail-label">Sale Amount</div><div className="detail-value">${Number(selected.sale_amount || 0).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Rate</div><div className="detail-value">{selected.commission_rate}%</div></div>
                <div className="detail-item"><div className="detail-label">Commission</div><div className="detail-value" style={{ color: '#4ade80' }}>${Number(selected.commission_amount || 0).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Pay Period</div><div className="detail-value">{selected.pay_period || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="detail-label">Deal</div><div className="detail-value">{selected.deal_id ? `Deal #${selected.deal_id}` : 'N/A'}</div></div>
              </div>
              {selected.notes && (
                <div className="detail-item" style={{ marginTop: 12 }}>
                  <div className="detail-label">Notes</div>
                  <div className="detail-value">{selected.notes}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setForm({ ...selected }); setEditing(true); }}>Edit</button>
              <button className="btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Commission</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>&times;</button>
            </div>
            <div className="modal-body">{formFields}</div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleUpdate}>Save</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Commission</h3>
              <button className="modal-close" onClick={() => setCreating(false)}>&times;</button>
            </div>
            <div className="modal-body">{formFields}</div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleCreate}>Add Commission</button>
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommissionsPage;
