const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) ||
  process.env.REACT_APP_API_URL || 'http://localhost:5847/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (email, password, name) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });

// Inventory
export const getInventory = () => request('/inventory');
export const getVehicle = (id) => request(`/inventory/${id}`);
export const createVehicle = (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicle = (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicle = (id) => request(`/inventory/${id}`, { method: 'DELETE' });
export const aiPriceAnalysis = (id) => request(`/inventory/${id}/ai-price`, { method: 'POST' });

// Customers
export const getCustomers = () => request('/customers');
export const getCustomer = (id) => request(`/customers/${id}`);
export const createCustomer = (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) });
export const updateCustomer = (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCustomer = (id) => request(`/customers/${id}`, { method: 'DELETE' });
export const aiMatchCustomer = (id) => request(`/customers/${id}/ai-match`, { method: 'POST' });

// Trade-ins
export const getTradeIns = () => request('/trade-ins');
export const getTradeIn = (id) => request(`/trade-ins/${id}`);
export const createTradeIn = (data) => request('/trade-ins', { method: 'POST', body: JSON.stringify(data) });
export const updateTradeIn = (id, data) => request(`/trade-ins/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTradeIn = (id) => request(`/trade-ins/${id}`, { method: 'DELETE' });
export const aiValuateTradeIn = (id) => request(`/trade-ins/${id}/ai-valuate`, { method: 'POST' });
export const tradeInConfidenceScore = (body) => request('/trade-in-confidence/score', { method: 'POST', body: JSON.stringify(body) });

// F&I Products
export const getFniProducts = () => request('/fni-products');
export const getFniProduct = (id) => request(`/fni-products/${id}`);
export const createFniProduct = (data) => request('/fni-products', { method: 'POST', body: JSON.stringify(data) });
export const updateFniProduct = (id, data) => request(`/fni-products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFniProduct = (id) => request(`/fni-products/${id}`, { method: 'DELETE' });
export const aiFniRecommend = (customer_id, deal_id) =>
  request('/fni-products/ai-recommend', { method: 'POST', body: JSON.stringify({ customer_id, deal_id }) });

// Leads
export const getLeads = () => request('/leads');
export const getLead = (id) => request(`/leads/${id}`);
export const createLead = (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) });
export const updateLead = (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLead = (id) => request(`/leads/${id}`, { method: 'DELETE' });
export const aiScoreLead = (id) => request(`/leads/${id}/ai-score`, { method: 'POST' });

// Deals
export const getDeals = () => request('/deals');
export const getDeal = (id) => request(`/deals/${id}`);
export const createDeal = (data) => request('/deals', { method: 'POST', body: JSON.stringify(data) });
export const updateDeal = (id, data) => request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDeal = (id) => request(`/deals/${id}`, { method: 'DELETE' });
export const aiAnalyzeDeal = (id) => request(`/deals/${id}/ai-analyze`, { method: 'POST' });

// Analytics
export const getDashboardStats = () => request('/analytics/dashboard');
export const aiInsights = () => request('/analytics/ai-insights', { method: 'POST' });

// Service Appointments
export const getServiceAppointments = () => request('/service-appointments');
export const getServiceAppointment = (id) => request(`/service-appointments/${id}`);
export const createServiceAppointment = (data) => request('/service-appointments', { method: 'POST', body: JSON.stringify(data) });
export const updateServiceAppointment = (id, data) => request(`/service-appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteServiceAppointment = (id) => request(`/service-appointments/${id}`, { method: 'DELETE' });
export const aiAnalyzeService = (id) => request(`/service-appointments/${id}/ai-analyze`, { method: 'POST' });

// Vehicle Inspections
export const getInspections = () => request('/inspections');
export const getInspection = (id) => request(`/inspections/${id}`);
export const createInspection = (data) => request('/inspections', { method: 'POST', body: JSON.stringify(data) });
export const updateInspection = (id, data) => request(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteInspection = (id) => request(`/inspections/${id}`, { method: 'DELETE' });
export const aiAnalyzeInspection = (id) => request(`/inspections/${id}/ai-analyze`, { method: 'POST' });

// Test Drives
export const getTestDrives = () => request('/test-drives');
export const getTestDrive = (id) => request(`/test-drives/${id}`);
export const createTestDrive = (data) => request('/test-drives', { method: 'POST', body: JSON.stringify(data) });
export const updateTestDrive = (id, data) => request(`/test-drives/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTestDrive = (id) => request(`/test-drives/${id}`, { method: 'DELETE' });
export const aiAnalyzeTestDrive = (id) => request(`/test-drives/${id}/ai-analyze`, { method: 'POST' });

// Customer Follow-ups
export const getFollowups = () => request('/followups');
export const getFollowup = (id) => request(`/followups/${id}`);
export const createFollowup = (data) => request('/followups', { method: 'POST', body: JSON.stringify(data) });
export const updateFollowup = (id, data) => request(`/followups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFollowup = (id) => request(`/followups/${id}`, { method: 'DELETE' });
export const aiAnalyzeFollowup = (id) => request(`/followups/${id}/ai-analyze`, { method: 'POST' });

// Marketing Campaigns
export const getCampaigns = () => request('/campaigns');
export const getCampaign = (id) => request(`/campaigns/${id}`);
export const createCampaign = (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) });
export const updateCampaign = (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCampaign = (id) => request(`/campaigns/${id}`, { method: 'DELETE' });
export const aiAnalyzeCampaign = (id) => request(`/campaigns/${id}/ai-analyze`, { method: 'POST' });

// Staff
export const getStaff = () => request('/staff');
export const getStaffMember = (id) => request(`/staff/${id}`);
export const createStaff = (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaff = (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStaff = (id) => request(`/staff/${id}`, { method: 'DELETE' });
export const getStaffPerformance = (id) => request(`/staff/${id}/performance`);

// Commissions
export const getCommissions = () => request('/commissions');
export const getCommission = (id) => request(`/commissions/${id}`);
export const createCommission = (data) => request('/commissions', { method: 'POST', body: JSON.stringify(data) });
export const updateCommission = (id, data) => request(`/commissions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCommission = (id) => request(`/commissions/${id}`, { method: 'DELETE' });
export const getCommissionSummary = () => request('/commissions/summary/by-staff');

// Documents
export const getDocuments = () => request('/documents');
export const getDocument = (id) => request(`/documents/${id}`);
export const createDocument = (data) => request('/documents', { method: 'POST', body: JSON.stringify(data) });
export const updateDocument = (id, data) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDocument = (id) => request(`/documents/${id}`, { method: 'DELETE' });

// Reports
export const getSalesSummary = (startDate, endDate) => {
  const params = startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '';
  return request(`/reports/sales-summary${params}`);
};
export const getInventoryReport = () => request('/reports/inventory-report');
export const getCustomerReport = () => request('/reports/customer-report');
export const getLeadConversion = () => request('/reports/lead-conversion');
export const exportData = async (type) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/reports/export/${type}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
};

// Settings
export const getSettings = () => request('/settings');
export const getSettingsFlat = () => request('/settings/flat');
export const updateSetting = (id, value) => request(`/settings/${id}`, { method: 'PUT', body: JSON.stringify({ setting_value: value }) });
export const bulkUpdateSettings = (settings) => request('/settings/bulk/update', { method: 'PUT', body: JSON.stringify({ settings }) });

// New AI Studio features
export const aiTradeInPhoto = (body) => request('/ai/trade-in-photo-analysis', { method: 'POST', body: JSON.stringify(body) });
export const aiInventoryAging = (body) => request('/ai/inventory-aging', { method: 'POST', body: JSON.stringify(body) });
export const aiPaymentOptimizer = (body) => request('/ai/payment-optimizer', { method: 'POST', body: JSON.stringify(body) });
export const aiMarketDemand = (body) => request('/ai/market-demand', { method: 'POST', body: JSON.stringify(body) });
export const aiCustomerPersona = (body) => request('/ai/customer-persona', { method: 'POST', body: JSON.stringify(body) });
export const aiWarrantyAnalyzer = (body) => request('/ai/warranty-analyzer', { method: 'POST', body: JSON.stringify(body) });
export const aiComplianceChecker = (body) => request('/ai/compliance-checker', { method: 'POST', body: JSON.stringify(body) });
export const aiSalesCoach = (body) => request('/ai/sales-coach', { method: 'POST', body: JSON.stringify(body) });
export const aiResultsHistory = (page = 1, limit = 20, feature = '') => {
  const qs = new URLSearchParams({ page, limit, ...(feature ? { feature } : {}) }).toString();
  return request(`/ai/results?${qs}`);
};

// Webhooks
export const listWebhooks = () => request('/webhooks');
export const createWebhook = (data) => request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
export const deleteWebhook = (id) => request(`/webhooks/${id}`, { method: 'DELETE' });
export const testWebhook = (id) => request(`/webhooks/${id}/test`, { method: 'POST' });
