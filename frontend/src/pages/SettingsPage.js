import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting, bulkUpdateSettings } from '../services/api';

function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      const values = {};
      Object.values(data).forEach(category => {
        Object.entries(category).forEach(([key, setting]) => {
          values[setting.id] = setting.value;
        });
      });
      setEditValues(values);
    } catch (err) { console.error(err); }
  };

  const handleChange = (id, value) => {
    setEditValues({ ...editValues, [id]: value });
    setSaved(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(editValues).map(([id, setting_value]) => ({
        id: parseInt(id),
        setting_value
      }));
      await bulkUpdateSettings(settingsToUpdate);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert('Save failed: ' + err.message); }
    setSaving(false);
  };

  const categoryLabels = {
    general: 'General Information',
    financial: 'Financial Settings',
    hours: 'Business Hours',
    notifications: 'Notification Preferences',
    inventory: 'Inventory Settings'
  };

  const categoryIcons = {
    general: '🏢',
    financial: '💰',
    hours: '🕐',
    notifications: '🔔',
    inventory: '🚗'
  };

  const renderSettingInput = (key, setting) => {
    const id = setting.id;
    const value = editValues[id] ?? setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleChange(id, value === 'true' ? 'false' : 'true')}
              style={{
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                background: value === 'true' ? '#3b82f6' : 'rgba(148,163,184,0.2)',
                position: 'relative', transition: 'all 0.2s'
              }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: value === 'true' ? 25 : 3,
                transition: 'left 0.2s'
              }} />
            </button>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{value === 'true' ? 'Enabled' : 'Disabled'}</span>
          </div>
        );
      case 'select':
        return (
          <select value={value} onChange={e => handleChange(id, e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e2e8f0', fontSize: 14 }}>
            {(setting.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'number':
        return <input type="number" value={value} onChange={e => handleChange(id, e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e2e8f0', fontSize: 14, width: 120 }} />;
      default:
        return <input type="text" value={value} onChange={e => handleChange(id, e.target.value)}
          style={{ padding: '8px 12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e2e8f0', fontSize: 14, width: '100%', maxWidth: 400 }} />;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dealership Settings</h2>
        <div className="page-actions">
          {saved && <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 500 }}>Settings saved!</span>}
          <button className="btn-new" onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {Object.entries(settings).map(([category, items]) => (
        <div key={category} style={{
          background: 'rgba(30,41,59,0.6)',
          border: '1px solid rgba(148,163,184,0.08)',
          borderRadius: 16, padding: 24, marginBottom: 20
        }}>
          <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{categoryIcons[category] || '⚙️'}</span>
            {categoryLabels[category] || category}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(items).map(([key, setting]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'rgba(15,23,42,0.4)', borderRadius: 10
              }}>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{setting.label || key}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{key}</div>
                </div>
                {renderSettingInput(key, setting)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(settings).length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
          <p style={{ fontSize: 16 }}>No settings configured yet.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Run the database seed to populate default settings.</p>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
