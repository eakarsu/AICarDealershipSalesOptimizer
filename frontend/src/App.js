import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import TradeInsPage from './pages/TradeInsPage';
import FniPage from './pages/FniPage';
import LeadsPage from './pages/LeadsPage';
import DealsPage from './pages/DealsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ServicePage from './pages/ServicePage';
import InspectionsPage from './pages/InspectionsPage';
import TestDrivesPage from './pages/TestDrivesPage';
import FollowupsPage from './pages/FollowupsPage';
import CampaignsPage from './pages/CampaignsPage';
import StaffPage from './pages/StaffPage';
import CommissionsPage from './pages/CommissionsPage';
import DocumentsPage from './pages/DocumentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/trade-ins" element={<TradeInsPage />} />
            <Route path="/fni" element={<FniPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/service" element={<ServicePage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/test-drives" element={<TestDrivesPage />} />
            <Route path="/followups" element={<FollowupsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/commissions" element={<CommissionsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
