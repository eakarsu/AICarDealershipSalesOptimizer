import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const features = [
  {
    key: 'inventory',
    path: '/inventory',
    title: 'Inventory Pricing',
    description: 'AI-powered market pricing analysis for optimal vehicle pricing strategy',
    icon: '🚗',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    statKey: 'inventory',
    statLabel: 'vehicles',
  },
  {
    key: 'customers',
    path: '/customers',
    title: 'Customer-Vehicle Matching',
    description: 'Intelligent matching of customers to their perfect vehicle using AI',
    icon: '👥',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    statKey: 'customers',
    statLabel: 'customers',
  },
  {
    key: 'trade-ins',
    path: '/trade-ins',
    title: 'Trade-In Valuation',
    description: 'AI-powered trade-in vehicle appraisal with market data analysis',
    icon: '🔄',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    statKey: 'trade_ins',
    statLabel: 'trade-ins',
  },
  {
    key: 'fni',
    path: '/fni',
    title: 'F&I Product Recommendations',
    description: 'Smart finance & insurance product recommendations per customer profile',
    icon: '🛡️',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    statKey: 'fni_products',
    statLabel: 'products',
  },
  {
    key: 'leads',
    path: '/leads',
    title: 'Lead Scoring',
    description: 'AI-driven lead prioritization and engagement strategy recommendations',
    icon: '📊',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    statKey: 'leads',
    statLabel: 'leads',
  },
  {
    key: 'deals',
    path: '/deals',
    title: 'Deal Management',
    description: 'Track and optimize deals with AI profitability analysis',
    icon: '💰',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    statKey: 'deals',
    statLabel: 'deals',
  },
  {
    key: 'analytics',
    path: '/analytics',
    title: 'Sales Analytics',
    description: 'Comprehensive dealership performance insights powered by AI',
    icon: '📈',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
  },
  {
    key: 'service',
    path: '/service',
    title: 'Service & Maintenance',
    description: 'Schedule and manage service appointments with AI upsell recommendations',
    icon: '🔧',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.12)',
    statKey: 'service_appointments',
    statLabel: 'appointments',
  },
  {
    key: 'inspections',
    path: '/inspections',
    title: 'Vehicle Inspections',
    description: 'Multi-point inspection reports with AI condition assessment',
    icon: '🔍',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    statKey: 'inspections',
    statLabel: 'inspections',
  },
  {
    key: 'test-drives',
    path: '/test-drives',
    title: 'Test Drive Scheduling',
    description: 'Manage test drives and optimize follow-up with AI sales strategy',
    icon: '🏎️',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    statKey: 'test_drives',
    statLabel: 'test drives',
  },
  {
    key: 'followups',
    path: '/followups',
    title: 'Customer Follow-Up CRM',
    description: 'Track interactions and get AI-powered engagement recommendations',
    icon: '📞',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    statKey: 'followups',
    statLabel: 'follow-ups',
  },
  {
    key: 'campaigns',
    path: '/campaigns',
    title: 'Marketing Campaigns',
    description: 'Manage campaigns and optimize ROI with AI performance analysis',
    icon: '📣',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.12)',
    statKey: 'campaigns',
    statLabel: 'campaigns',
  },
  {
    key: 'staff',
    path: '/staff',
    title: 'Staff Management',
    description: 'Manage employee profiles, roles, departments and track performance',
    icon: '🧑‍💼',
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.12)',
    statKey: 'staff',
    statLabel: 'staff members',
  },
  {
    key: 'commissions',
    path: '/commissions',
    title: 'Commission Tracker',
    description: 'Track sales commissions, payouts and earnings by staff member',
    icon: '💵',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    statKey: 'commissions',
    statLabel: 'commissions',
  },
  {
    key: 'documents',
    path: '/documents',
    title: 'Document Management',
    description: 'Store and manage vehicle titles, contracts, warranties and more',
    icon: '📁',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
    statKey: 'documents',
    statLabel: 'documents',
  },
  {
    key: 'reports',
    path: '/reports',
    title: 'Reports & Export',
    description: 'Generate sales, inventory and customer reports with CSV export',
    icon: '📋',
    color: '#b45309',
    bg: 'rgba(180, 83, 9, 0.12)',
  },
  {
    key: 'settings',
    path: '/settings',
    title: 'Dealership Settings',
    description: 'Configure tax rates, fees, business hours and preferences',
    icon: '⚙️',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
  }, []);

  const getStatCount = (feature) => {
    if (!stats || !feature.statKey) return null;
    const s = stats[feature.statKey];
    return s ? s.total : null;
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Welcome to AutoGenius AI - Your intelligent dealership command center</p>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-label">Total Inventory</div>
            <div className="stat-value">{stats.inventory?.total || 0}</div>
            <div className="stat-sub">{stats.inventory?.available || 0} available</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg. Vehicle Price</div>
            <div className="stat-value">${(stats.inventory?.avg_price || 0).toLocaleString()}</div>
            <div className="stat-sub">{stats.inventory?.avg_days_on_lot || 0} avg days on lot</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Customers</div>
            <div className="stat-value">{stats.customers?.active || 0}</div>
            <div className="stat-sub">{stats.customers?.total || 0} total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Leads</div>
            <div className="stat-value">{stats.leads?.new_leads || 0}</div>
            <div className="stat-sub">Avg score: {stats.leads?.avg_score || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">${(stats.deals?.total_revenue || 0).toLocaleString()}</div>
            <div className="stat-sub">{stats.deals?.completed || 0} completed deals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg. Margin</div>
            <div className="stat-value">{stats.deals?.avg_margin || 0}%</div>
            <div className="stat-sub">{stats.deals?.total || 0} total deals</div>
          </div>
        </div>
      )}

      <div className="feature-grid">
        {features.map((feature) => (
          <div
            key={feature.key}
            className="feature-card"
            style={{ '--card-color': feature.color }}
            onClick={() => navigate(feature.path)}
          >
            <div className="feature-card-icon" style={{ background: feature.bg }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            {getStatCount(feature) !== null && (
              <div className="feature-count">
                {getStatCount(feature)} {feature.statLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
