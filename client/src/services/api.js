const BASE = 'http://localhost:3000';

export function getToken() { return localStorage.getItem('vb_token'); }
export function setToken(t) { localStorage.setItem('vb_token', t); }
export function clearToken() { localStorage.removeItem('vb_token'); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.detail || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const patch = (p, b) => request('PATCH', p, b);
const del = (p) => request('DELETE', p);

export const api = {
  // auth
  login: (email, password) => post('/auth/login', { email, password }),
  signup: (data) => post('/auth/signup', data),
  me: () => get('/auth/me'),
  updateProfile: (data) => put('/auth/profile', data),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => post('/auth/reset-password', { token, new_password }),

  // vendors
  getVendors: (params = {}) => get('/vendors?' + new URLSearchParams(params)),
  createVendor: (data) => post('/vendors', data),
  getVendorMe: () => get('/vendors/me'),
  getVendor: (id) => get(`/vendors/${id}`),
  updateVendor: (id, data) => put(`/vendors/${id}`, data),
  deleteVendor: (id) => del(`/vendors/${id}`),

  // rfqs
  getRFQs: (params = {}) => get('/rfqs?' + new URLSearchParams(params)),
  createRFQ: (data) => post('/rfqs', data),
  getRFQ: (id) => get(`/rfqs/${id}`),
  updateRFQStatus: (id, status) => patch(`/rfqs/${id}/status?status=${status}`),
  deleteRFQ: (id) => del(`/rfqs/${id}`),

  // quotations
  submitQuotation: (data) => post('/quotations', data),
  getQuotationsForRFQ: (rfqId) => get(`/quotations/rfq/${rfqId}`),
  getQuotation: (id) => get(`/quotations/${id}`),
  compareQuotations: (rfqId) => get(`/quotations/compare/${rfqId}`),
  updateQuotationStatus: (id, status) => patch(`/quotations/${id}/status?status=${status}`),

  // approvals
  initiateApproval: (quotationId) => post('/approvals', { quotation_id: quotationId }),
  getApprovals: () => get('/approvals'),
  getPendingApprovals: () => get('/approvals/pending'),
  processApproval: (id, status, remarks = '') => patch(`/approvals/${id}/action`, { status, remarks }),

  // purchase orders
  createPO: (data) => post('/purchase-orders', data),
  getPOs: () => get('/purchase-orders'),
  getPO: (id) => get(`/purchase-orders/${id}`),
  updatePOStatus: (id, status) => patch(`/purchase-orders/${id}/status?status=${status}`),

  // invoices
  generateInvoice: (poId, taxRate = 18) => post('/invoices', { po_id: poId, tax_rate: taxRate }),
  getInvoices: () => get('/invoices'),
  getInvoice: (id) => get(`/invoices/${id}`),
  updateInvoiceStatus: (id, status) => patch(`/invoices/${id}/status?status=${status}`),
  sendInvoiceEmail: (id, recipientEmail = null) => post(`/invoices/${id}/send-email`, { recipient_email: recipientEmail }),

  // dashboard
  getDashboard: () => get('/dashboard'),

  // activity
  getActivity: (params = {}) => get('/activity?' + new URLSearchParams(params)),

  // reports
  getVendorPerformance: () => get('/reports/vendor-performance'),
  getSpendingSummary: () => get('/reports/spending-summary'),
  getProcurementStats: () => get('/reports/procurement-stats'),

  // users
  getUsers: () => get('/users'),
  toggleUserActive: (id) => patch(`/users/${id}/toggle-active`),
  deleteUser: (id) => del(`/users/${id}`),

  // notifications
  getNotifications: () => get('/notifications'),
};
