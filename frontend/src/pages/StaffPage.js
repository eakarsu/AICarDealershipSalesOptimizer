import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff, getStaffPerformance } from '../services/api';

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = () => getStaff().then(setStaff).catch(console.error);

  const handleCreate = async () => {
    try {
      await createStaff(form);
      setCreating(false);
      setForm({});
      loadStaff();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async () => {
    try {
      await updateStaff(selected.id, form);
      setEditing(false);
      setSelected(null);
      setForm({});
      loadStaff();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await deleteStaff(id);
      setSelected(null);
      loadStaff();
    } catch (err) { alert(err.message); }
  };

  const handleViewPerformance = async (member) => {
    try {
      const data = await getStaffPerformance(member.id);
      setPerformance(data);
    } catch (err) { alert(err.message); }
  };

  const openEdit = (member) => {
    setSelected(member);
    setForm({ ...member, hire_date: member.hire_date ? member.hire_date.slice(0, 10) : '' });
    setEditing(true);
  };

  const openCreate = () => {
    setForm({ role: 'sales', department: 'Sales', status: 'active', commission_rate: 5 });
    setCreating(true);
  };

  const formFields = (
    <div className="edit-form">
      <div className="form-group">
        <label>First Name</label>
        <input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Last Name</label>
        <input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Role</label>
        <select value={form.role || 'sales'} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="sales">Sales</option>
          <option value="manager">Manager</option>
          <option value="finance">Finance</option>
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="form-group">
        <label>Department</label>
        <select value={form.department || 'Sales'} onChange={e => setForm({ ...form, department: e.target.value })}>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="Service">Service</option>
          <option value="Management">Management</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div className="form-group">
        <label>Hire Date</label>
        <input type="date" value={form.hire_date || ''} onChange={e => setForm({ ...form, hire_date: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Salary ($)</label>
        <input type="number" value={form.salary || ''} onChange={e => setForm({ ...form, salary: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Commission Rate (%)</label>
        <input type="number" step="0.5" value={form.commission_rate || ''} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Staff Management</h2>
        <div className="page-actions">
          <button className="btn-new" onClick={openCreate}>+ Add Staff</button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Department</th>
              <th>Commission %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(m => (
              <tr key={m.id} onClick={() => { setSelected(m); setPerformance(null); }}>
                <td style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</td>
                <td>{m.email}</td>
                <td>{m.phone}</td>
                <td>{m.role}</td>
                <td>{m.department}</td>
                <td>{m.commission_rate}%</td>
                <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
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
                <div className="detail-item"><div className="detail-label">Role</div><div className="detail-value">{selected.role}</div></div>
                <div className="detail-item"><div className="detail-label">Department</div><div className="detail-value">{selected.department}</div></div>
                <div className="detail-item"><div className="detail-label">Hire Date</div><div className="detail-value">{selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Salary</div><div className="detail-value">${Number(selected.salary || 0).toLocaleString()}</div></div>
                <div className="detail-item"><div className="detail-label">Commission Rate</div><div className="detail-value">{selected.commission_rate}%</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
              </div>

              {!performance && (
                <button className="btn-secondary" onClick={() => handleViewPerformance(selected)} style={{ marginBottom: 16 }}>
                  View Performance
                </button>
              )}

              {performance && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ color: '#f1f5f9', marginBottom: 12 }}>Performance Summary</h4>
                  <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">Total Deals</div><div className="detail-value">{performance.performance.total_deals}</div></div>
                    <div className="detail-item"><div className="detail-label">Completed Deals</div><div className="detail-value">{performance.performance.completed_deals}</div></div>
                    <div className="detail-item"><div className="detail-label">Total Revenue</div><div className="detail-value">${Number(performance.performance.total_revenue).toLocaleString()}</div></div>
                    <div className="detail-item"><div className="detail-label">Avg Margin</div><div className="detail-value">{Number(performance.performance.avg_margin).toFixed(1)}%</div></div>
                    <div className="detail-item"><div className="detail-label">Test Drives</div><div className="detail-value">{performance.performance.test_drives}</div></div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => openEdit(selected)}>Edit</button>
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
              <h3>Edit Staff Member</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>&times;</button>
            </div>
            <div className="modal-body">{formFields}</div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleUpdate}>Save Changes</button>
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
              <h3>Add Staff Member</h3>
              <button className="modal-close" onClick={() => setCreating(false)}>&times;</button>
            </div>
            <div className="modal-body">{formFields}</div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleCreate}>Add Staff</button>
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
