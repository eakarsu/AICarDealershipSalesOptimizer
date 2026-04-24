import React, { useState, useEffect } from 'react';
import { getSalesSummary, getInventoryReport, getCustomerReport, getLeadConversion, exportData } from '../services/api';

function ReportsPage() {
  const [activeReport, setActiveReport] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReport(activeReport); }, [activeReport]);

  const loadReport = async (type) => {
    setLoading(true);
    try {
      switch (type) {
        case 'sales': setSalesData(await getSalesSummary()); break;
        case 'inventory': setInventoryData(await getInventoryReport()); break;
        case 'customers': setCustomerData(await getCustomerReport()); break;
        case 'leads': setLeadData(await getLeadConversion()); break;
        default: break;
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleExport = async (type) => {
    try {
      const blob = await exportData(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const reports = [
    { key: 'sales', label: 'Sales Summary', icon: '💰' },
    { key: 'inventory', label: 'Inventory Report', icon: '🚗' },
    { key: 'customers', label: 'Customer Report', icon: '👥' },
    { key: 'leads', label: 'Lead Conversion', icon: '📊' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Export</h2>
        <div className="page-actions">
          <select className="btn-secondary" onChange={e => handleExport(e.target.value)} defaultValue=""
            style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 16px' }}>
            <option value="" disabled>Export CSV...</option>
            <option value="inventory">Inventory</option>
            <option value="customers">Customers</option>
            <option value="deals">Deals</option>
            <option value="leads">Leads</option>
            <option value="staff">Staff</option>
            <option value="commissions">Commissions</option>
          </select>
        </div>
      </div>

      {/* Report Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {reports.map(r => (
          <button key={r.key}
            onClick={() => setActiveReport(r.key)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeReport === r.key ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.1)',
              color: activeReport === r.key ? '#60a5fa' : '#94a3b8',
              fontWeight: 500, fontSize: 14, fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s'
            }}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="ai-loading"><div className="spinner"></div><p>Loading report...</p></div>
      )}

      {/* Sales Summary Report */}
      {activeReport === 'sales' && salesData && !loading && (
        <div>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">${Number(salesData.summary.total_revenue).toLocaleString()}</div>
              <div className="stat-sub">{salesData.summary.completed_deals} completed deals</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Sale Price</div>
              <div className="stat-value">${Number(salesData.summary.avg_sale_price).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Profit Margin</div>
              <div className="stat-value">{Number(salesData.summary.avg_profit_margin).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">F&I Revenue</div>
              <div className="stat-value">${Number(salesData.summary.total_fni_revenue).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Trade-In Value</div>
              <div className="stat-value">${Number(salesData.summary.total_trade_in_value).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Deals</div>
              <div className="stat-value" style={{ color: '#fbbf24' }}>{salesData.summary.pending_deals}</div>
            </div>
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>Sales by Person</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Sales Person</th><th>Deals</th><th>Completed</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {salesData.by_sales_person.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.sales_person || 'Unassigned'}</td>
                    <td>{p.deals}</td>
                    <td>{p.completed}</td>
                    <td style={{ color: '#4ade80' }}>${Number(p.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeReport === 'inventory' && inventoryData && !loading && (
        <div>
          <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Inventory Aging</h3>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-label">Under 30 Days</div>
              <div className="stat-value" style={{ color: '#4ade80' }}>{inventoryData.aging.under_30_days || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">31-60 Days</div>
              <div className="stat-value" style={{ color: '#fbbf24' }}>{inventoryData.aging.days_31_60 || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">61-90 Days</div>
              <div className="stat-value" style={{ color: '#f97316' }}>{inventoryData.aging.days_61_90 || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Over 90 Days</div>
              <div className="stat-value" style={{ color: '#f87171' }}>{inventoryData.aging.over_90_days || 0}</div>
            </div>
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>Status Breakdown</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Status</th><th>Count</th><th>Avg Price</th><th>Avg Days on Lot</th><th>Total Value</th></tr>
              </thead>
              <tbody>
                {inventoryData.status_breakdown.map((s, i) => (
                  <tr key={i}>
                    <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                    <td>{s.count}</td>
                    <td>${Number(s.avg_price).toLocaleString()}</td>
                    <td>{Number(s.avg_days_on_lot).toFixed(0)} days</td>
                    <td>${Number(s.total_value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>Top Makes</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>Make</th><th>Count</th><th>Avg Price</th></tr>
              </thead>
              <tbody>
                {inventoryData.top_makes.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.make}</td>
                    <td>{m.count}</td>
                    <td>${Number(m.avg_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Report */}
      {activeReport === 'customers' && customerData && !loading && (
        <div>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{customerData.overview.total_customers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active</div>
              <div className="stat-value" style={{ color: '#4ade80' }}>{customerData.overview.active_customers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Need Financing</div>
              <div className="stat-value">{customerData.overview.need_financing}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Budget</div>
              <div className="stat-value">${Number(customerData.overview.avg_budget).toLocaleString()}</div>
            </div>
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>Preferred Makes</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Make</th><th>Customers</th></tr></thead>
              <tbody>
                {customerData.preferred_makes.map((m, i) => (
                  <tr key={i}><td style={{ fontWeight: 600 }}>{m.preferred_make}</td><td>{m.count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>Recent Deals</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Vehicle</th><th>Price</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {customerData.recent_deals.map((d, i) => (
                  <tr key={i}>
                    <td>{d.customer_name}</td>
                    <td>{d.vehicle}</td>
                    <td>${Number(d.sale_price || 0).toLocaleString()}</td>
                    <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Conversion Report */}
      {activeReport === 'leads' && leadData && !loading && (
        <div>
          <h3 style={{ color: '#f1f5f9', marginBottom: 16 }}>Lead Funnel</h3>
          <div className="dashboard-stats">
            {leadData.funnel.map((f, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-label">{f.status}</div>
                <div className="stat-value">{f.count}</div>
              </div>
            ))}
          </div>

          <h3 style={{ color: '#f1f5f9', margin: '24px 0 16px' }}>By Source</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Source</th><th>Total</th><th>Converted</th><th>Avg Score</th><th>Conv. Rate</th></tr></thead>
              <tbody>
                {leadData.by_source.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.source || 'Unknown'}</td>
                    <td>{s.total}</td>
                    <td>{s.converted}</td>
                    <td>{Number(s.avg_score).toFixed(0)}</td>
                    <td>{s.total > 0 ? ((s.converted / s.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
