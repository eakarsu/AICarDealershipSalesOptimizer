import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/customers', label: 'Customers' },
    { path: '/trade-ins', label: 'Trade-Ins' },
    { path: '/trade-in-confidence', label: 'Trade-In Confidence' },
    { path: '/fni', label: 'F&I Products' },
    { path: '/leads', label: 'Leads' },
    { path: '/deals', label: 'Deals' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/service', label: 'Service' },
    { path: '/inspections', label: 'Inspections' },
    { path: '/test-drives', label: 'Test Drives' },
    { path: '/followups', label: 'Follow-Ups' },
    { path: '/campaigns', label: 'Campaigns' },
    { path: '/staff', label: 'Staff' },
    { path: '/commissions', label: 'Commissions' },
    { path: '/documents', label: 'Documents' },
    { path: '/reports', label: 'Reports' },
    { path: '/settings', label: 'Settings' },
    { path: '/ai-studio', label: 'AI Studio' },
    { path: '/webhooks', label: 'Webhooks' },
    { path: '/custom-views', label: 'Sales Views' },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <h1>AutoGenius AI</h1>
      </Link>

      <div className="navbar-nav">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        <span>{user.name}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
