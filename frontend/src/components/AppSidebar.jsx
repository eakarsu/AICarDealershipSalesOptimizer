import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/insights/timeline', label: 'Timeline View', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/inventory', label: 'Inventory', group: 'Workspace' },
  { to: '/customers', label: 'Customers', group: 'Workspace' },
  { to: '/trade-ins', label: 'Trade Ins', group: 'Workspace' },
  { to: '/trade-in-confidence', label: 'Trade In Confidence', group: 'Workspace' },
  { to: '/fni', label: 'Fni', group: 'Workspace' },
  { to: '/leads', label: 'Leads', group: 'Workspace' },
  { to: '/deals', label: 'Deals', group: 'Workspace' },
  { to: '/analytics', label: 'Analytics', group: 'Workspace' },
  { to: '/service', label: 'Service', group: 'Workspace' },
  { to: '/inspections', label: 'Inspections', group: 'Workspace' },
  { to: '/test-drives', label: 'Test Drives', group: 'Workspace' },
  { to: '/followups', label: 'Followups', group: 'Workspace' },
  { to: '/campaigns', label: 'Campaigns', group: 'Workspace' },
  { to: '/staff', label: 'Staff', group: 'Workspace' },
  { to: '/commissions', label: 'Commissions', group: 'Workspace' },
  { to: '/documents', label: 'Documents', group: 'Workspace' },
  { to: '/reports', label: 'Reports', group: 'Workspace' },
  { to: '/settings', label: 'Settings', group: 'Workspace' },
  { to: '/ai-studio', label: 'AI Studio', group: 'Workspace' },
  { to: '/webhooks', label: 'Webhooks', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AICar Dealership Sales Optimizer</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
