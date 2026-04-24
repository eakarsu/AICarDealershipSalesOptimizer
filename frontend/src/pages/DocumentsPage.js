import React, { useState, useEffect } from 'react';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../services/api';

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({});

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = () => getDocuments().then(setDocuments).catch(console.error);

  const handleCreate = async () => {
    try {
      await createDocument(form);
      setCreating(false);
      setForm({});
      loadDocuments();
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async () => {
    try {
      await updateDocument(selected.id, form);
      setEditing(false);
      setSelected(null);
      loadDocuments();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      setSelected(null);
      loadDocuments();
    } catch (err) { alert(err.message); }
  };

  const openCreate = () => {
    setForm({ document_type: 'title', related_to: 'vehicle', status: 'active' });
    setCreating(true);
  };

  const filtered = filter === 'all' ? documents : documents.filter(d => d.document_type === filter);

  const docTypes = ['title', 'registration', 'insurance', 'contract', 'inspection', 'warranty', 'invoice', 'other'];
  const typeIcons = { title: '📄', registration: '📋', insurance: '🛡️', contract: '📝', inspection: '🔍', warranty: '✅', invoice: '💵', other: '📎' };

  const formFields = (
    <div className="edit-form">
      <div className="form-group">
        <label>Title</label>
        <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Document Type</label>
        <select value={form.document_type || 'title'} onChange={e => setForm({ ...form, document_type: e.target.value })}>
          {docTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Related To</label>
        <select value={form.related_to || 'vehicle'} onChange={e => setForm({ ...form, related_to: e.target.value })}>
          <option value="vehicle">Vehicle</option>
          <option value="deal">Deal</option>
          <option value="customer">Customer</option>
          <option value="trade_in">Trade-In</option>
          <option value="dealership">Dealership</option>
        </select>
      </div>
      <div className="form-group">
        <label>Related ID</label>
        <input type="number" value={form.related_id || ''} onChange={e => setForm({ ...form, related_id: e.target.value })} placeholder="ID of related record" />
      </div>
      <div className="form-group full-width">
        <label>Description</label>
        <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="form-group">
        <label>File Name</label>
        <input value={form.file_name || ''} onChange={e => setForm({ ...form, file_name: e.target.value })} placeholder="document.pdf" />
      </div>
      <div className="form-group">
        <label>File Size</label>
        <input value={form.file_size || ''} onChange={e => setForm({ ...form, file_size: e.target.value })} placeholder="e.g. 2.5 MB" />
      </div>
      <div className="form-group">
        <label>Uploaded By</label>
        <input value={form.uploaded_by || ''} onChange={e => setForm({ ...form, uploaded_by: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Expiry Date</label>
        <input type="date" value={form.expiry_date ? form.expiry_date.slice(0, 10) : ''} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Document Management</h2>
        <div className="page-actions">
          <select className="btn-secondary" value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 16px' }}>
            <option value="all">All Types</option>
            {docTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <button className="btn-new" onClick={openCreate}>+ Add Document</button>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Documents</div>
          <div className="stat-value">{documents.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: '#4ade80' }}>{documents.filter(d => d.status === 'active').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expiring Soon</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {documents.filter(d => {
              if (!d.expiry_date) return false;
              const diff = (new Date(d.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
              return diff > 0 && diff <= 30;
            }).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expired</div>
          <div className="stat-value" style={{ color: '#f87171' }}>{documents.filter(d => d.status === 'expired').length}</div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Related To</th>
              <th>File</th>
              <th>Uploaded By</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} onClick={() => setSelected(d)}>
                <td>{typeIcons[d.document_type] || '📎'} {d.document_type}</td>
                <td style={{ fontWeight: 600 }}>{d.title}</td>
                <td>{d.related_to} #{d.related_id}</td>
                <td>{d.file_name || 'N/A'}</td>
                <td>{d.uploaded_by || 'N/A'}</td>
                <td>{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'None'}</td>
                <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
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
              <h3>{selected.title}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Type</div><div className="detail-value">{selected.document_type}</div></div>
                <div className="detail-item"><div className="detail-label">Related To</div><div className="detail-value">{selected.related_to} #{selected.related_id}</div></div>
                <div className="detail-item"><div className="detail-label">File Name</div><div className="detail-value">{selected.file_name || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">File Size</div><div className="detail-value">{selected.file_size || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Uploaded By</div><div className="detail-value">{selected.uploaded_by || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Expiry Date</div><div className="detail-value">{selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString() : 'None'}</div></div>
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="detail-label">Created</div><div className="detail-value">{new Date(selected.created_at).toLocaleDateString()}</div></div>
              </div>
              {selected.description && (
                <div className="detail-item" style={{ marginTop: 12 }}>
                  <div className="detail-label">Description</div>
                  <div className="detail-value">{selected.description}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setForm({ ...selected, expiry_date: selected.expiry_date || '' }); setEditing(true); }}>Edit</button>
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
              <h3>Edit Document</h3>
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
              <h3>Add Document</h3>
              <button className="modal-close" onClick={() => setCreating(false)}>&times;</button>
            </div>
            <div className="modal-body">{formFields}</div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleCreate}>Add Document</button>
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;
