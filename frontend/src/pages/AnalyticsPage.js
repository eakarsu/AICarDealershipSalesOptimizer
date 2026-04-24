import React, { useState, useEffect } from 'react';
import { getDashboardStats, aiInsights } from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  const handleAI = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try { setAiResult(await aiInsights()); } catch (e) { setAiError(e.message); }
    finally { setAiLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Sales Analytics</h2>
        <div className="page-actions">
          <button className="btn-ai" onClick={handleAI} disabled={aiLoading}>✨ AI Strategic Insights</button>
        </div>
      </div>

      {stats && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
              <div className="stat-label">Total Inventory</div>
              <div className="stat-value">{stats.inventory?.total || 0}</div>
              <div className="stat-sub">{stats.inventory?.available || 0} available</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
              <div className="stat-label">Avg. Price</div>
              <div className="stat-value">${(stats.inventory?.avg_price || 0).toLocaleString()}</div>
              <div className="stat-sub">per vehicle</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #06b6d4' }}>
              <div className="stat-label">Avg. Days on Lot</div>
              <div className="stat-value">{stats.inventory?.avg_days_on_lot || 0}</div>
              <div className="stat-sub">days average</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #10b981' }}>
              <div className="stat-label">Active Customers</div>
              <div className="stat-value">{stats.customers?.active || 0}</div>
              <div className="stat-sub">of {stats.customers?.total || 0} total</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">${(stats.deals?.total_revenue || 0).toLocaleString()}</div>
              <div className="stat-sub">{stats.deals?.completed || 0} completed deals</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
              <div className="stat-label">Avg. Profit Margin</div>
              <div className="stat-value">{stats.deals?.avg_margin || 0}%</div>
              <div className="stat-sub">{stats.deals?.total || 0} total deals</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #ec4899' }}>
              <div className="stat-label">New Leads</div>
              <div className="stat-value">{stats.leads?.new_leads || 0}</div>
              <div className="stat-sub">avg score: {stats.leads?.avg_score || 0}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #14b8a6' }}>
              <div className="stat-label">Trade-Ins</div>
              <div className="stat-value">{stats.trade_ins?.total || 0}</div>
              <div className="stat-sub">avg value: ${(stats.trade_ins?.avg_valuation || 0).toLocaleString()}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
            <div className="data-table-container">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>Inventory Summary</h3>
              </div>
              <div style={{ padding: 20 }}>
                <div className="ai-metric"><span className="ai-metric-label">Total Vehicles</span><span className="ai-metric-value">{stats.inventory?.total}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Available</span><span className="ai-metric-value" style={{ color: '#4ade80' }}>{stats.inventory?.available}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Average Price</span><span className="ai-metric-value">${(stats.inventory?.avg_price || 0).toLocaleString()}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Avg Days on Lot</span><span className="ai-metric-value">{stats.inventory?.avg_days_on_lot}</span></div>
              </div>
            </div>
            <div className="data-table-container">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>Deals Summary</h3>
              </div>
              <div style={{ padding: 20 }}>
                <div className="ai-metric"><span className="ai-metric-label">Total Deals</span><span className="ai-metric-value">{stats.deals?.total}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Completed</span><span className="ai-metric-value" style={{ color: '#4ade80' }}>{stats.deals?.completed}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Total Revenue</span><span className="ai-metric-value">${(stats.deals?.total_revenue || 0).toLocaleString()}</span></div>
                <div className="ai-metric"><span className="ai-metric-label">Avg Margin</span><span className="ai-metric-value">{stats.deals?.avg_margin}%</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <AIResultDisplay result={aiResult} loading={aiLoading} error={aiError} type="analytics" />
      </div>
    </div>
  );
}

export default AnalyticsPage;
