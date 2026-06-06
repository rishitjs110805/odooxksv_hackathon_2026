import { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, FileText, GitCompare, ShoppingCart, Receipt, BarChart3,
  Plus, CheckCircle2, XCircle, Clock, Users, DollarSign, TrendingUp,
  Send, Printer, Download, ChevronRight, AlertCircle, Package,
  Building2, Star, ArrowUpRight, ArrowDownRight, Search,
  X, Check, Bell, Calendar, Tag, Zap, Eye, ChevronDown,
  LogIn, UserPlus, Upload, Trash2, Edit, Filter, Shield,
  Activity, FileCheck, ClipboardList, Globe, Phone, Mail,
  Lock, User, Image, ArrowRight, CircleDot, Hash
} from 'lucide-react';


// ═══════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const initialVendors = [
  { id: 'V-001', name: 'Infra Supplies Pvt Ltd', category: 'Hardware', rating: 4.8, onTime: 96, contact: 'vendor@infrasupplies.com', phone: '+91 98765 43210', totalOrders: 42, status: 'Active', location: 'Mumbai, India' },
  { id: 'V-002', name: 'Office Furnishings Co', category: 'Furniture', rating: 4.5, onTime: 91, contact: 'sales@officefurnish.com', phone: '+91 87654 32109', totalOrders: 28, status: 'Active', location: 'Delhi, India' },
  { id: 'V-003', name: 'DigiParts Industries', category: 'Electronics', rating: 4.2, onTime: 88, contact: 'orders@digiparts.in', phone: '+91 76543 21098', totalOrders: 15, status: 'Active', location: 'Bangalore, India' },
  { id: 'V-004', name: 'GreenSource Materials', category: 'Stationery', rating: 4.6, onTime: 94, contact: 'hello@greensource.com', phone: '+91 65432 10987', totalOrders: 33, status: 'Inactive', location: 'Pune, India' },
];

const initialRFQs = [
  { id: 'RFQ-001', title: 'Office Furniture Procurement Q1', category: 'Furniture', quantity: 50, deadline: '2025-06-15', status: 'Open', vendors: ['V-002', 'V-004'], createdAt: '2025-05-20', description: 'Procurement of ergonomic desks and chairs for new office wing.', items: [{ name: 'Standing Desk', qty: 30, unit: 'pcs', estCost: 15000 }, { name: 'Ergonomic Chair', qty: 20, unit: 'pcs', estCost: 8000 }] },
  { id: 'RFQ-002', title: 'IT Infrastructure Upgrade', category: 'Hardware', quantity: 100, deadline: '2025-06-30', status: 'Open', vendors: ['V-001', 'V-003'], createdAt: '2025-05-25', description: 'Server and networking equipment for data center expansion.', items: [{ name: 'Rack Server', qty: 10, unit: 'pcs', estCost: 120000 }, { name: 'Network Switch', qty: 20, unit: 'pcs', estCost: 25000 }] },
  { id: 'RFQ-003', title: 'Stationery Supply FY26', category: 'Stationery', quantity: 500, deadline: '2025-07-01', status: 'Draft', vendors: [], createdAt: '2025-06-01', description: 'Annual stationery procurement for all departments.', items: [{ name: 'A4 Paper Reams', qty: 200, unit: 'reams', estCost: 350 }, { name: 'Printer Cartridges', qty: 50, unit: 'pcs', estCost: 2500 }] },
  { id: 'RFQ-004', title: 'Laptop Fleet Procurement', category: 'Electronics', quantity: 75, deadline: '2025-06-20', status: 'Closed', vendors: ['V-001', 'V-003'], createdAt: '2025-05-10', description: 'Laptops for new hires in engineering and design teams.', items: [{ name: 'Laptop 14" i7', qty: 50, unit: 'pcs', estCost: 72000 }, { name: 'Laptop 16" i9', qty: 25, unit: 'pcs', estCost: 135000 }] },
];

const initialQuotations = [
  { id: 'QT-001', rfqId: 'RFQ-001', vendorId: 'V-002', vendorName: 'Office Furnishings Co', unitPrice: 14200, totalPrice: 710000, deliveryDays: 14, qualityScore: 92, warranty: '2 Years', notes: 'Includes installation', submittedAt: '2025-05-28' },
  { id: 'QT-002', rfqId: 'RFQ-001', vendorId: 'V-004', vendorName: 'GreenSource Materials', unitPrice: 13800, totalPrice: 690000, deliveryDays: 21, qualityScore: 87, warranty: '1 Year', notes: 'Bulk discount 5%', submittedAt: '2025-05-30' },
  { id: 'QT-003', rfqId: 'RFQ-002', vendorId: 'V-001', vendorName: 'Infra Supplies Pvt Ltd', unitPrice: 108000, totalPrice: 1890000, deliveryDays: 10, qualityScore: 95, warranty: '3 Years', notes: 'Premium SLA included', submittedAt: '2025-06-01' },
  { id: 'QT-004', rfqId: 'RFQ-002', vendorId: 'V-003', vendorName: 'DigiParts Industries', unitPrice: 102000, totalPrice: 1780000, deliveryDays: 18, qualityScore: 89, warranty: '2 Years', notes: 'Extended support available', submittedAt: '2025-06-02' },
];

const initialPOs = [
  { id: 'PO-2025-001', rfqId: 'RFQ-004', vendorId: 'V-001', vendorName: 'Infra Supplies Pvt Ltd', vendorAddress: '42 Industrial Area, Andheri East, Mumbai 400093', vendorGST: 'GSTIN:27AADCI1234F1ZH', amount: 189400, items: [{ name: 'Laptop 14" i7', qty: 50, unitPrice: 72000, total: 3600000 }, { name: 'Laptop 16" i9', qty: 25, unitPrice: 135000, total: 3375000 }], status: 'Approved', createdAt: '2025-05-15', approver: 'VP Engineering', poDate: '21 may 2025', deliveryDate: '15 june 2025' },
  { id: 'PO-2025-002', rfqId: 'RFQ-001', vendorId: 'V-002', vendorName: 'Office Furnishings Co', vendorAddress: '108 Commerce Hub, Connaught Place, Delhi 110001', vendorGST: 'GSTIN:07AADCO5678G2ZK', amount: 710000, items: [{ name: 'Standing Desk', qty: 30, unitPrice: 15000, total: 450000 }, { name: 'Ergonomic Chair', qty: 20, unitPrice: 8000, total: 160000 }], status: 'Pending Approval', createdAt: '2025-06-03', approver: 'CFO', poDate: '03 june 2025', deliveryDate: '20 june 2025' },
];

const initialInvoices = [
  {
    id: 'INV-2025-001', poId: 'PO-2025-001', vendorName: 'Infra Supplies Pvt Ltd', vendorAddress: '42 Industrial Area, Andheri East, Mumbai 400093', vendorGST: 'GSTIN:27AADCI1234F1ZH',
    date: '2025-05-21', dueDate: '2025-06-21', status: 'Unpaid',
    items: [
      { name: 'Laptop 14" i7 16GB', qty: 50, unitPrice: 72000 },
      { name: 'Laptop 16" i9 32GB', qty: 25, unitPrice: 135000 },
      { name: 'Setup & Imaging Service', qty: 75, unitPrice: 500 },
    ],
    taxRate: 18, notes: 'Payment terms: Net 30. Dispatch within 10 business days.'
  },
  {
    id: 'INV-2025-002', poId: 'PO-2025-002', vendorName: 'Office Furnishings Co', vendorAddress: '108 Commerce Hub, Connaught Place, Delhi 110001', vendorGST: 'GSTIN:07AADCO5678G2ZK',
    date: '2025-06-03', dueDate: '2025-07-03', status: 'Paid',
    items: [
      { name: 'Ergonomic Standing Desk', qty: 30, unitPrice: 15000 },
      { name: 'Executive Mesh Chair', qty: 20, unitPrice: 8000 },
      { name: 'Delivery & Assembly', qty: 1, unitPrice: 12000 },
    ],
    taxRate: 18, notes: 'Payment terms: Net 30.'
  },
];

const initialActivities = [
  { id: 1, action: 'RFQ Created', detail: 'RFQ-003 — Stationery Supply FY26 created by Manav Panchal', time: '2 hours ago', type: 'rfq', icon: 'create' },
  { id: 2, action: 'Quotation Submitted', detail: 'Infra Supplies pvt ltd submitted quotation for RFQ-002 (IT Infrastructure)', time: '4 hours ago', type: 'quotation', icon: 'receive' },
  { id: 3, action: 'PO Approved', detail: 'PO-2025-001 approved by VP Engineering — ₹18,94,000', time: '1 day ago', type: 'approval', icon: 'approve' },
  { id: 4, action: 'Invoice Generated', detail: 'INV-2025-001 for Infra Supplies Pvt Ltd — auto-generated', time: '1 day ago', type: 'invoice', icon: 'invoice' },
  { id: 5, action: 'Vendor Added', detail: 'GreenSource Materials onboarded and quality-verified', time: '3 days ago', type: 'vendor', icon: 'vendor' },
  { id: 6, action: 'RFQ Closed', detail: 'RFQ-004 — Laptop Fleet Procurement closed after evaluation', time: '5 days ago', type: 'rfq', icon: 'close' },
  { id: 7, action: 'Approval Rejected', detail: 'PO draft for RFQ-003 rejected by Finance Head — budget mismatch', time: '6 days ago', type: 'approval', icon: 'reject' },
  { id: 8, action: 'Quotation Compared', detail: 'Quotation comparison completed for RFQ-001 — 2 vendors evaluated', time: '7 days ago', type: 'quotation', icon: 'compare' },
];

const initialApprovals = [
  { id: 'APR-001', rfqId: 'RFQ-001', poId: 'PO-2025-002', vendorName: 'Office Furnishings Co', amount: 710000, status: 'Pending', currentStep: 2, steps: ['Submitted', 'Manager Review', 'Finance Check', 'Director Sign-off', 'Completed'], createdAt: '2025-06-03' },
  { id: 'APR-002', rfqId: 'RFQ-004', poId: 'PO-2025-001', vendorName: 'Infra Supplies Pvt Ltd', amount: 189400, status: 'Approved', currentStep: 5, steps: ['Submitted', 'Manager Review', 'Finance Check', 'Director Sign-off', 'Completed'], createdAt: '2025-05-15' },
];


// ═══════════════════════════════════════════════════════════════════════════
//  UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md min-w-[340px] max-w-[440px] ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-100'
            : toast.type === 'error' ? 'bg-red-950/90 border-red-700/50 text-red-100'
            : 'bg-slate-800/90 border-slate-600/50 text-slate-100'
          }`}
          style={{ animation: 'slideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards' }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
           : toast.type === 'error' ? <XCircle size={20} className="text-red-400 shrink-0" />
           : <AlertCircle size={20} className="text-blue-400 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white transition-colors shrink-0"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    'Draft': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    'Open': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Closed': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    'Approved': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Pending Approval': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Rejected': 'bg-red-500/15 text-red-400 border-red-500/30',
    'Paid': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Unpaid': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Active': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Inactive': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };
  const iconMap = { 'Approved': Check, 'Paid': Check, 'Active': Check, 'Pending Approval': Clock, 'Pending': Clock, 'Unpaid': Clock, 'Rejected': X };
  const Icon = iconMap[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
      {Icon && <Icon size={12} className="mr-1" />}
      {status}
    </span>
  );
}

function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 1 — LOGIN
// ═══════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin, onGoToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl shadow-indigo-500/30">V</div>
          <h1 className="text-2xl font-bold text-white mt-4 tracking-tight">VendorBridge</h1>
          <p className="text-slate-400 text-sm mt-1">Procurement ERP Platform</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {/* Avatar placeholder */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
              <User size={32} className="text-slate-500" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>

            <button onClick={() => onLogin(username || 'Manav Panchal')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 mt-2">
              <LogIn size={16} /> Login
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <button onClick={onGoToRegister} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Register</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 2 — REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

function RegistrationScreen({ onRegister, onGoToLogin }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'officer', country: '', additional: '' });
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl shadow-indigo-500/30">V</div>
          <h1 className="text-2xl font-bold text-white mt-4">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join VendorBridge Procurement Platform</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Photo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
                <Image size={28} className="text-slate-500" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition-colors shadow-lg">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
              <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First name"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
              <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last name"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <select value={form.role} onChange={e => update('role', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none">
                <option value="officer">Procurement Officer</option>
                <option value="vendor">Vendor</option>
                <option value="approver">Approver</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={form.country} onChange={e => update('country', e.target.value)} placeholder="India"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Information</label>
            <textarea value={form.additional} onChange={e => update('additional', e.target.value)} rows={3} placeholder="Company name, department, etc."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none" />
          </div>

          <button onClick={() => onRegister(form.firstName || 'Manav', form.lastName || 'Panchal')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 mt-6">
            <UserPlus size={16} /> Create Account
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <button onClick={onGoToLogin} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 3 — DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard({ userName, vendors, rfqs, pos, activities, setActiveView, addToast }) {
  const activeRFQs = rfqs.filter(r => r.status === 'Open').length;
  const pendingApprovals = pos.filter(po => po.status === 'Pending Approval').length;
  const totalSpend = pos.filter(po => po.status === 'Approved').reduce((sum, po) => sum + po.amount, 0);

  const recentItems = [...rfqs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionHeader title={`Welcome, ${userName}`} subtitle="Officer — Today's Overview" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active RFQs', value: activeRFQs, icon: FileText, color: 'indigo', change: '+3 this week' },
          { label: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'amber', change: '2 urgent' },
          { label: 'Total Spend', value: `₹${(totalSpend / 100).toFixed(1)}L`, icon: DollarSign, color: 'emerald', change: '+12% vs last month' },
          { label: 'Total Vendors', value: vendors.length, icon: Users, color: 'blue', change: `${vendors.filter(v => v.status === 'Active').length} active` },
        ].map(({ label, value, icon: Icon, color, change }) => {
          const colorMap = {
            indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20',
            emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
            amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
            blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
          };
          const iconColor = { indigo: 'text-indigo-400', emerald: 'text-emerald-400', amber: 'text-amber-400', blue: 'text-blue-400' };
          return (
            <div key={label} className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 cursor-default group`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 font-medium">{label}</p>
                  <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
                  <p className="text-xs text-slate-500 mt-2">{change}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${iconColor[color]}`}><Icon size={24} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Procurement Table */}
      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Procurement Entries</h2>
          <button onClick={() => setActiveView('rfqs')} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['RFQ ID', 'Title', 'Category', 'Qty', 'Deadline', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentItems.map(rfq => (
                <tr key={rfq.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-3.5 text-sm font-mono text-indigo-400">{rfq.id}</td>
                  <td className="px-6 py-3.5 text-sm text-white font-medium">{rfq.title}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300">{rfq.category}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300">{rfq.quantity}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300">{rfq.deadline}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={rfq.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setActiveView('rfqs')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20">
          <Plus size={16} /> New RFQ
        </button>
        <button onClick={() => setActiveView('vendors')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all duration-200">
          <UserPlus size={16} /> Add Vendor
        </button>
        <button onClick={() => setActiveView('reports')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all duration-200">
          <BarChart3 size={16} /> View Analytics
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 4 — VENDORS
// ═══════════════════════════════════════════════════════════════════════════

function VendorsPage({ vendors, setVendors, addToast }) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', contact: '', phone: '', location: '' });

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.category) { addToast('Missing Fields', 'Vendor name and category are required.', 'error'); return; }
    const newVendor = {
      id: `V-${String(vendors.length + 1).padStart(3, '0')}`,
      name: form.name, category: form.category, rating: 0, onTime: 0,
      contact: form.contact, phone: form.phone, totalOrders: 0, status: 'Active', location: form.location,
    };
    setVendors(prev => [...prev, newVendor]);
    setForm({ name: '', category: '', contact: '', phone: '', location: '' });
    setShowForm(false);
    addToast('Vendor Added', `${newVendor.name} has been onboarded successfully.`, 'success');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Vendors" subtitle="Vendor profiles and registrations">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, category..."
            className="pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all w-64" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Vendor'}
        </button>
      </SectionHeader>

      {showForm && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-4" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 size={18} className="text-indigo-400" /> Register New Vendor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Vendor Name *', key: 'name', placeholder: 'e.g. Infra Supplies Pvt Ltd' },
              { label: 'Category *', key: 'category', placeholder: 'e.g. Hardware, Furniture' },
              { label: 'Email', key: 'contact', placeholder: 'vendor@company.com' },
              { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210' },
              { label: 'Location', key: 'location', placeholder: 'Mumbai, India' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                <input type="text" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20">
              <Plus size={16} /> Add Vendor
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['ID', 'Vendor Name', 'Category', 'Location', 'Rating', 'On-Time %', 'Orders', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-mono text-indigo-400">{v.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/20">{v.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-white">{v.name}</p>
                        <p className="text-xs text-slate-500">{v.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.location}</td>
                  <td className="px-6 py-4">
                    {v.rating > 0 ? (
                      <div className="flex items-center gap-1 text-amber-400"><Star size={14} className="fill-amber-400" /><span className="text-sm font-semibold">{v.rating}</span></div>
                    ) : <span className="text-xs text-slate-500">New</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.onTime > 0 ? `${v.onTime}%` : '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.totalOrders}</td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 5 — CREATE RFQ
// ═══════════════════════════════════════════════════════════════════════════

function RFQManager({ rfqs, setRfqs, vendors, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', deadline: '', vendor: '' });
  const [items, setItems] = useState([{ name: '', qty: '', unit: 'pcs', estCost: '' }]);

  const addItem = () => setItems(prev => [...prev, { name: '', qty: '', unit: 'pcs', estCost: '' }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const handleCreate = () => {
    if (!form.title || !form.category || !form.deadline) { addToast('Missing Fields', 'Please fill title, category and deadline.', 'error'); return; }
    const validItems = items.filter(it => it.name && it.qty);
    const newRFQ = {
      id: `RFQ-${String(rfqs.length + 1).padStart(3, '0')}`,
      title: form.title, description: form.description, category: form.category,
      quantity: validItems.reduce((s, it) => s + parseInt(it.qty || 0), 0),
      deadline: form.deadline, status: 'Draft', vendors: form.vendor ? [form.vendor] : [],
      createdAt: new Date().toISOString().split('T')[0],
      items: validItems.map(it => ({ name: it.name, qty: parseInt(it.qty), unit: it.unit, estCost: parseFloat(it.estCost || 0) })),
    };
    setRfqs(prev => [newRFQ, ...prev]);
    setForm({ title: '', description: '', category: '', deadline: '', vendor: '' });
    setItems([{ name: '', qty: '', unit: 'pcs', estCost: '' }]);
    setShowForm(false);
    addToast('RFQ Created', `${newRFQ.id} — ${newRFQ.title}`, 'success');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="RFQ's" subtitle="Request for quotation">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Create RFQ'}
        </button>
      </SectionHeader>

      {showForm && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-5" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ClipboardList size={18} className="text-indigo-400" /> Create RFQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">RFQ Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office Furniture Procurement Q1"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none">
                <option value="">Select category</option>
                {['Hardware', 'Furniture', 'Electronics', 'Stationery', 'Raw Materials', 'Logistics'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Describe the procurement requirement..."
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none" />
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">Line Items</label>
              <button onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"><Plus size={14} /> Add Row</button>
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-slate-900/50">
                  {['Item Name', 'Quantity', 'Unit', 'Est. Cost (₹)', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
                </tr></thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-4 py-2"><input type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" className="w-full px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" /></td>
                      <td className="px-4 py-2"><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" className="w-full px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" /></td>
                      <td className="px-4 py-2">
                        <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
                          {['pcs', 'reams', 'kg', 'ltrs', 'boxes'].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input type="number" value={item.estCost} onChange={e => updateItem(i, 'estCost', e.target.value)} placeholder="0" className="w-full px-3 py-1.5 bg-transparent border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" /></td>
                      <td className="px-4 py-2">{items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400/60 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Deadline *</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Preferred Vendor</label>
              <select value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none">
                <option value="">Select vendor (optional)</option>
                {vendors.filter(v => v.status === 'Active').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {/* File upload mock */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Attachments</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-indigo-500/30 transition-colors cursor-pointer">
              <Upload size={24} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Drag & drop files or <span className="text-indigo-400 font-medium">click to upload</span></p>
              <p className="text-xs text-slate-500 mt-1">PDF, XLSX, DOCX up to 10MB</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all">Cancel</button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20">
              <Plus size={16} /> Create RFQ
            </button>
          </div>
        </div>
      )}

      {/* RFQ List */}
      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">
              {['RFQ ID', 'Title', 'Category', 'Qty', 'Deadline', 'Status'].map(h => <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-mono text-indigo-400">{rfq.id}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{rfq.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{rfq.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{rfq.quantity}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{rfq.deadline}</td>
                  <td className="px-6 py-4"><StatusBadge status={rfq.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 6 & 7 — QUOTATIONS (Submit + Comparison)
// ═══════════════════════════════════════════════════════════════════════════

function QuotationsPage({ quotations, setQuotations, rfqs, setRfqs, setPOs, pos, vendors, addToast }) {
  const [tab, setTab] = useState('compare');
  const [selectedRFQ, setSelectedRFQ] = useState('RFQ-001');
  const [submitForm, setSubmitForm] = useState({ rfqId: 'RFQ-001', vendorId: '', unitPrice: '', deliveryDays: '', warranty: '', notes: '' });

  const rfq = rfqs.find(r => r.id === selectedRFQ);
  const relevantQuotes = quotations.filter(q => q.rfqId === selectedRFQ);

  const bestQuote = useMemo(() => {
    if (!relevantQuotes.length) return null;
    return relevantQuotes.reduce((best, q) => {
      const score = (q.qualityScore * 0.4) + ((1 / q.unitPrice) * 500000 * 0.35) + ((1 / q.deliveryDays) * 100 * 0.25);
      const bestScore = (best.qualityScore * 0.4) + ((1 / best.unitPrice) * 500000 * 0.35) + ((1 / best.deliveryDays) * 100 * 0.25);
      return score > bestScore ? q : best;
    });
  }, [relevantQuotes]);

  const handleSubmitQuotation = () => {
    if (!submitForm.vendorId || !submitForm.unitPrice) { addToast('Missing Fields', 'Vendor and unit price are required.', 'error'); return; }
    const vendor = vendors.find(v => v.id === submitForm.vendorId);
    const newQt = {
      id: `QT-${String(quotations.length + 1).padStart(3, '0')}`,
      rfqId: submitForm.rfqId, vendorId: submitForm.vendorId, vendorName: vendor?.name || '',
      unitPrice: parseFloat(submitForm.unitPrice), totalPrice: parseFloat(submitForm.unitPrice) * (rfqs.find(r => r.id === submitForm.rfqId)?.quantity || 1),
      deliveryDays: parseInt(submitForm.deliveryDays || 14), qualityScore: Math.floor(Math.random() * 15) + 80,
      warranty: submitForm.warranty || '1 Year', notes: submitForm.notes, submittedAt: new Date().toISOString().split('T')[0],
    };
    setQuotations(prev => [...prev, newQt]);
    setSubmitForm({ rfqId: 'RFQ-001', vendorId: '', unitPrice: '', deliveryDays: '', warranty: '', notes: '' });
    addToast('Quotation Submitted', `${vendor?.name} quotation for ${submitForm.rfqId} recorded.`, 'success');
  };

  const handleInitiateApproval = () => {
    if (!bestQuote) return;
    setRfqs(prev => prev.map(r => r.id === selectedRFQ ? { ...r, status: 'Approved' } : r));
    const existing = pos.find(po => po.rfqId === selectedRFQ);
    if (!existing) {
      setPOs(prev => [...prev, {
        id: `PO-2025-${String(pos.length + 1).padStart(3, '0')}`, rfqId: selectedRFQ, vendorId: bestQuote.vendorId,
        vendorName: bestQuote.vendorName, vendorAddress: '', vendorGST: '', amount: bestQuote.totalPrice,
        items: rfq?.items?.map(it => ({ name: it.name, qty: it.qty, unitPrice: bestQuote.unitPrice, total: it.qty * bestQuote.unitPrice })) || [],
        status: 'Pending Approval', createdAt: new Date().toISOString().split('T')[0], approver: 'Procurement Director',
        poDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), deliveryDate: rfq?.deadline || '',
      }]);
    }
    addToast('Approval Initiated', `${bestQuote.vendorName} selected for ${selectedRFQ}. PO created.`, 'success');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Quotations" subtitle={tab === 'compare' ? 'Compare vendor responses' : 'Submit a new quotation'}>
        <div className="flex bg-slate-800/60 rounded-xl p-1 border border-white/10">
          <button onClick={() => setTab('compare')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'compare' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Comparison</button>
          <button onClick={() => setTab('submit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'submit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Submit Quotation</button>
        </div>
      </SectionHeader>

      {/* ── SUBMIT TAB ── */}
      {tab === 'submit' && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Submit Quotation</h2>
          <p className="text-sm text-slate-400">RFQ: <span className="text-white font-medium">{rfqs.find(r => r.id === submitForm.rfqId)?.title || '—'}</span> — deadline {rfqs.find(r => r.id === submitForm.rfqId)?.deadline}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Select RFQ</label>
              <select value={submitForm.rfqId} onChange={e => setSubmitForm({ ...submitForm, rfqId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
                {rfqs.filter(r => r.status === 'Open').map(r => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Vendor *</label>
              <select value={submitForm.vendorId} onChange={e => setSubmitForm({ ...submitForm, vendorId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
                <option value="">Select vendor</option>
                {vendors.filter(v => v.status === 'Active').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Unit Price (₹) *</label>
              <input type="number" value={submitForm.unitPrice} onChange={e => setSubmitForm({ ...submitForm, unitPrice: e.target.value })} placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Days</label>
              <input type="number" value={submitForm.deliveryDays} onChange={e => setSubmitForm({ ...submitForm, deliveryDays: e.target.value })} placeholder="14"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Warranty</label>
              <input type="text" value={submitForm.warranty} onChange={e => setSubmitForm({ ...submitForm, warranty: e.target.value })} placeholder="e.g. 2 Years"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
              <input type="text" value={submitForm.notes} onChange={e => setSubmitForm({ ...submitForm, notes: e.target.value })} placeholder="Additional info"
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmitQuotation} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20">
              <Send size={16} /> Submit Quotation
            </button>
          </div>
        </div>
      )}

      {/* ── COMPARISON TAB ── */}
      {tab === 'compare' && (
        <>
          {/* RFQ Selector + Info Bar */}
          <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <select value={selectedRFQ} onChange={e => setSelectedRFQ(e.target.value)}
                  className="px-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
                  {rfqs.filter(r => r.status !== 'Draft').map(r => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}
                </select>
                {rfq && <StatusBadge status={rfq.status} />}
              </div>
              <p className="text-sm text-slate-400">{relevantQuotes.length} quotation{relevantQuotes.length !== 1 ? 's' : ''} received</p>
            </div>
          </div>

          {relevantQuotes.length > 0 ? (
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-white/5">
                    {['Vendor', 'Unit Price', 'Total Price', 'Delivery', 'Quality', 'Warranty', 'Notes'].map(h => <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {relevantQuotes.map(q => {
                      const isBest = bestQuote?.id === q.id;
                      return (
                        <tr key={q.id} className={`border-b border-white/5 transition-colors duration-200 ${isBest ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-white/5'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border ${isBest ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-300'}`}>{q.vendorName.charAt(0)}</div>
                              <div>
                                <span className="text-sm font-medium text-white">{q.vendorName}</span>
                                {isBest && <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Best Match</span>}
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white'}`}>₹{q.unitPrice.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-sm font-semibold ${isBest ? 'text-emerald-400' : 'text-white'}`}>₹{q.totalPrice.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{q.deliveryDays} days</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${q.qualityScore >= 90 ? 'bg-emerald-500' : q.qualityScore >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${q.qualityScore}%` }} /></div>
                              <span className="text-sm text-slate-300 font-medium">{q.qualityScore}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{q.warranty}</td>
                          <td className="px-6 py-4 text-xs text-slate-400 max-w-[160px] truncate">{q.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-5 border-t border-white/5 bg-slate-900/30">
                <p className="text-sm text-slate-400"><span className="text-emerald-400 font-semibold">{bestQuote?.vendorName}</span> — best value based on price, quality & delivery.</p>
                <button onClick={handleInitiateApproval} disabled={rfq?.status === 'Approved'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:shadow-none">
                  <CheckCircle2 size={16} /> {rfq?.status === 'Approved' ? 'Already Approved' : 'Initiate Approval Workflow'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-12 text-center">
              <FileText size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No quotations received for this RFQ yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 8 — APPROVALS
// ═══════════════════════════════════════════════════════════════════════════

function ApprovalsPage({ approvals, setApprovals, pos, setPOs, addToast }) {
  const handleApprove = (aprId) => {
    setApprovals(prev => prev.map(a => a.id === aprId ? { ...a, status: 'Approved', currentStep: a.steps.length } : a));
    const apr = approvals.find(a => a.id === aprId);
    if (apr) setPOs(prev => prev.map(po => po.id === apr.poId ? { ...po, status: 'Approved' } : po));
    addToast('Approved', `Approval ${aprId} completed successfully.`, 'success');
  };

  const handleReject = (aprId) => {
    setApprovals(prev => prev.map(a => a.id === aprId ? { ...a, status: 'Rejected', currentStep: a.currentStep } : a));
    const apr = approvals.find(a => a.id === aprId);
    if (apr) setPOs(prev => prev.map(po => po.id === apr.poId ? { ...po, status: 'Rejected' } : po));
    addToast('Rejected', `Approval ${aprId} has been rejected.`, 'error');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Approvals" subtitle="Approval workflow management" />

      <div className="space-y-6">
        {approvals.map(apr => (
          <div key={apr.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-white">Approval Workflow</h3>
                  <StatusBadge status={apr.status} />
                </div>
                <p className="text-sm text-slate-400">RFQ: <span className="text-indigo-400 font-mono">{apr.rfqId}</span> — Vendor: <span className="text-white">{apr.vendorName}</span> — ₹{apr.amount.toLocaleString()}</p>
              </div>
              {apr.status === 'Pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(apr.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"><Check size={16} /> Approve</button>
                  <button onClick={() => handleReject(apr.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-all"><X size={16} /> Reject</button>
                </div>
              )}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-0">
              {apr.steps.map((step, i) => {
                const isCompleted = i < apr.currentStep;
                const isCurrent = i === apr.currentStep - 1 && apr.status === 'Pending';
                const isRejected = apr.status === 'Rejected' && i === apr.currentStep;
                return (
                  <div key={i} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        isRejected ? 'bg-red-500/20 border-red-500 text-red-400'
                        : isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : isCurrent ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse'
                        : 'bg-slate-800 border-white/10 text-slate-500'
                      }`}>
                        {isRejected ? <X size={16} /> : isCompleted ? <Check size={16} /> : i + 1}
                      </div>
                      <span className={`text-[11px] mt-2 font-medium text-center max-w-[80px] ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>{step}</span>
                    </div>
                    {i < apr.steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mt-[-20px] rounded-full ${isCompleted && i < apr.currentStep - 1 ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 9 — PURCHASE ORDERS & INVOICES
// ═══════════════════════════════════════════════════════════════════════════

function PurchaseOrdersPage({ pos, setPOs, invoices, addToast }) {
  const [selectedPO, setSelectedPO] = useState(null);

  const handleApprove = (poId) => {
    setPOs(prev => prev.map(po => po.id === poId ? { ...po, status: 'Approved' } : po));
    addToast('PO Approved', `${poId} approved successfully.`, 'success');
  };

  const handleReject = (poId) => {
    setPOs(prev => prev.map(po => po.id === poId ? { ...po, status: 'Rejected' } : po));
    addToast('PO Rejected', `${poId} has been rejected.`, 'error');
  };

  const po = selectedPO ? pos.find(p => p.id === selectedPO) : null;
  const invoice = po ? invoices.find(inv => inv.poId === po.id) : null;

  return (
    <div className="space-y-8">
      <SectionHeader title="Purchase Orders" subtitle="Manage purchase orders and invoices" />

      {/* PO Cards */}
      <div className="space-y-4">
        {pos.map(p => (
          <div key={p.id} className={`bg-slate-800/40 border rounded-2xl p-6 transition-all duration-200 cursor-pointer ${selectedPO === p.id ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 hover:border-white/10'}`}
            onClick={() => setSelectedPO(selectedPO === p.id ? null : p.id)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"><ShoppingCart size={22} className="text-indigo-400" /></div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-white">{p.id}</h3>
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-slate-500">auto-generated after approval</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-400 mt-2 flex-wrap">
                    <span>Vendor: <span className="text-white">{p.vendorName}</span></span>
                    <span>Amount: <span className="text-white font-semibold">₹{p.amount.toLocaleString()}</span></span>
                    <span>PO Date: <span className="text-slate-300">{p.poDate}</span></span>
                    <span>Delivery: <span className="text-slate-300">{p.deliveryDate}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.status === 'Pending Approval' && (
                  <>
                    <button onClick={e => { e.stopPropagation(); handleApprove(p.id); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all"><Check size={14} /> Approve</button>
                    <button onClick={e => { e.stopPropagation(); handleReject(p.id); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-all"><X size={14} /> Reject</button>
                  </>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${selectedPO === p.id ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Expanded Invoice View */}
            {selectedPO === p.id && (
              <div className="mt-6 pt-6 border-t border-white/5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-white">Purchase Order & Invoice</h4>
                  <div className="flex gap-2">
                    <button onClick={() => addToast('PDF Ready', `${p.id} PDF download started.`, 'info')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold transition-all"><Download size={14} /> PDF</button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold transition-all"><Printer size={14} /> Print</button>
                    <button onClick={() => addToast('Email Sent', `PO sent to ${p.vendorName}.`, 'success')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"><Send size={14} /> Email</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Bill To</p>
                    <p className="text-white font-medium">Your Organisation Name</p>
                    <p className="text-slate-400">GST: GSTIN:XXXXXXXXXX</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Vendor</p>
                    <p className="text-white font-medium">{p.vendorName}</p>
                    <p className="text-slate-400">{p.vendorAddress || '—'}</p>
                    <p className="text-slate-400">{p.vendorGST || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div><span className="text-slate-500">PO Number:</span> <span className="text-indigo-400 font-mono ml-1">{p.id}</span></div>
                  <div><span className="text-slate-500">Vendor Date:</span> <span className="text-slate-300 ml-1">{p.poDate}</span></div>
                  <div><span className="text-slate-500">PO Date:</span> <span className="text-slate-300 ml-1">{p.poDate}</span></div>
                  <div><span className="text-slate-500">Due Date:</span> <span className="text-slate-300 ml-1">{p.deliveryDate}</span></div>
                </div>

                {/* Items Table */}
                <div className="rounded-xl border border-white/10 overflow-hidden mb-4">
                  <table className="w-full">
                    <thead><tr className="bg-slate-900/50">
                      {['Item', 'Qty', 'Unit Price', 'Total'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {p.items.map((item, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-5 py-3 text-sm text-white">{item.name}</td>
                          <td className="px-5 py-3 text-sm text-slate-300">{item.qty}</td>
                          <td className="px-5 py-3 text-sm text-slate-300">₹{item.unitPrice?.toLocaleString() || '—'}</td>
                          <td className="px-5 py-3 text-sm text-white font-semibold">₹{item.total?.toLocaleString() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                {invoice && (() => {
                  const subtotal = invoice.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
                  const tax = subtotal * (invoice.taxRate / 100);
                  return (
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">₹{subtotal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">GST ({invoice.taxRate}%)</span><span className="text-white">₹{tax.toLocaleString()}</span></div>
                        <div className="h-px bg-white/10 my-1" />
                        <div className="flex justify-between text-base"><span className="text-white font-semibold">Total</span><span className="text-indigo-400 font-bold">₹{(subtotal + tax).toLocaleString()}</span></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  INVOICES PAGE (standalone)
// ═══════════════════════════════════════════════════════════════════════════

function InvoicesPage({ invoices, addToast }) {
  const [selectedId, setSelectedId] = useState(invoices[0]?.id);
  const invoice = invoices.find(inv => inv.id === selectedId);
  if (!invoice) return null;

  const subtotal = invoice.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className="space-y-8">
      <SectionHeader title="Invoices" subtitle="View and manage vendor invoices">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
          {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.id} — {inv.vendorName}</option>)}
        </select>
      </SectionHeader>

      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">V</div>
                <h2 className="text-xl font-bold text-white">VendorBridge</h2>
              </div>
              <p className="text-xs text-slate-500 mt-2">Procurement Management System</p>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold text-white tracking-tight">INVOICE</h3>
              <p className="text-sm text-indigo-400 font-mono font-semibold mt-1">{invoice.id}</p>
              <div className="mt-1"><StatusBadge status={invoice.status} /></div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bill From</p>
              <p className="text-sm font-semibold text-white">{invoice.vendorName}</p>
              <p className="text-sm text-slate-400 mt-1">{invoice.vendorAddress}</p>
              <p className="text-xs text-slate-500 mt-1">{invoice.vendorGST}</p>
            </div>
            <div className="text-right space-y-1.5 text-sm">
              <div><span className="text-slate-500">Issue:</span><span className="text-white ml-2">{invoice.date}</span></div>
              <div><span className="text-slate-500">Due:</span><span className="text-white ml-2">{invoice.dueDate}</span></div>
              <div><span className="text-slate-500">PO:</span><span className="text-indigo-400 font-mono ml-2">{invoice.poId}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-slate-900/50">
                {['#', 'Description', 'Qty', 'Unit Price', 'Amount'].map(h => <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase ${h === '#' || h === 'Description' ? 'text-left' : 'text-right'}`}>{h}</th>)}
              </tr></thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-5 py-3 text-sm text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3 text-sm text-white">{item.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">{item.qty}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">₹{item.unitPrice.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-white font-semibold text-right">₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white">₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">GST ({invoice.taxRate}%)</span><span className="text-white">₹{tax.toLocaleString()}</span></div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-lg"><span className="text-white font-semibold">Total</span><span className="text-indigo-400 font-bold">₹{total.toLocaleString()}</span></div>
            </div>
          </div>
          {invoice.notes && (
            <div className="bg-slate-900/40 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-slate-300">{invoice.notes}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-slate-900/30 no-print">
          <button onClick={() => addToast('Email Sent', `Invoice ${invoice.id} sent.`, 'success')} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all"><Send size={16} /> Email</button>
          <button onClick={() => addToast('PDF Ready', `Invoice ${invoice.id} PDF downloading.`, 'info')} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all"><Download size={16} /> PDF</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"><Printer size={16} /> Print</button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 10 — ACTIVITY & LOGS
// ═══════════════════════════════════════════════════════════════════════════

function ActivityLogsPage({ activities }) {
  const [filter, setFilter] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'rfq', label: 'RFQs' },
    { id: 'approval', label: 'Approvals' },
    { id: 'invoice', label: 'Invoices' },
    { id: 'vendor', label: 'Vendors' },
    { id: 'quotation', label: 'Quotations' },
  ];

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  const iconMap = {
    create: <Plus size={16} className="text-blue-400" />,
    receive: <FileText size={16} className="text-indigo-400" />,
    approve: <CheckCircle2 size={16} className="text-emerald-400" />,
    invoice: <Receipt size={16} className="text-amber-400" />,
    vendor: <Building2 size={16} className="text-purple-400" />,
    close: <XCircle size={16} className="text-zinc-400" />,
    reject: <XCircle size={16} className="text-red-400" />,
    compare: <GitCompare size={16} className="text-cyan-400" />,
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Activity & Logs" subtitle="Procurement audit trail">
        <p className="text-xs text-slate-500">All activity is logged in real-time. Filter using tabs below.</p>
      </SectionHeader>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              filter === t.id ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-slate-800/40 border border-white/5 rounded-2xl divide-y divide-white/5">
        {filtered.map(act => (
          <div key={act.id} className="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors group">
            <div className="mt-0.5 p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
              {iconMap[act.icon] || <CircleDot size={16} className="text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{act.action}</p>
              <p className="text-xs text-slate-400 mt-1">{act.detail}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-500">{act.time}</span>
              <div className="mt-1"><StatusBadge status={act.type === 'approval' ? 'Approved' : act.type === 'rfq' ? 'Open' : 'Active'} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SCREEN 11 — REPORTS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

function ReportsPage({ vendors, pos }) {
  const totalSpend = pos.reduce((s, po) => s + po.amount, 0);
  const approvedPct = pos.length > 0 ? Math.round((pos.filter(p => p.status === 'Approved').length / pos.length) * 100) : 0;

  const categories = [
    { name: 'Hardware', spend: 189400, pct: 64 },
    { name: 'Furniture', spend: 710000, pct: 24 },
    { name: 'Stationery', spend: 25000, pct: 8 },
    { name: 'Logistics', spend: 12000, pct: 4 },
  ];

  const vendorsByOffice = [
    { office: 'Infra Supplies Pvt Ltd', pos: 2, orders: 1 },
    { office: 'Office Furnishings Co', pos: 1, orders: 2 },
    { office: 'DigiParts Industries', pos: 1, orders: 3 },
    { office: 'GreenSource Materials', pos: 0, orders: 1 },
  ];

  const months = [
    { name: 'Jan', val: 30 }, { name: 'Feb', val: 45 }, { name: 'Mar', val: 38 },
    { name: 'Apr', val: 62 }, { name: 'May', val: 80 }, { name: 'Jun', val: 55 },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Reports & Analytics" subtitle={`Procurement Insights — ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-medium transition-all">Key Details</button>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-medium transition-all">Report</button>
        </div>
      </SectionHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-sm text-emerald-400 font-medium">Total Spend</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">₹{(totalSpend / 100000).toFixed(1)}L</p>
          <p className="text-xs text-emerald-400/60 mt-1">+12% vs last month</p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
          <p className="text-sm text-indigo-400 font-medium">Approval Rate</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{approvedPct}%</p>
          <p className="text-xs text-indigo-400/60 mt-1">POs approved on time</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-sm text-amber-400 font-medium">Active Vendors</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{vendors.filter(v => v.status === 'Active').length}</p>
          <p className="text-xs text-amber-400/60 mt-1">On vendor panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category */}
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5 uppercase tracking-wider text-xs text-slate-400">Spend by Category</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                {['Category', 'Spend', '%'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.name} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">₹{c.spend.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${c.pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{c.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendors by Office */}
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Vendors by Office</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                {['Vendor', 'POs', 'Orders'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {vendorsByOffice.map(v => (
                  <tr key={v.office} className="border-b border-white/5">
                    <td className="px-4 py-3 text-sm text-white">{v.office}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{v.pos}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{v.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-white/5 rounded-2xl p-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Monthly Trends</h2>
          <div className="flex items-end justify-between gap-4 h-48 px-4">
            {months.map(m => (
              <div key={m.name} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">₹{m.val}k</span>
                <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${m.val * 2}px` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-600 to-indigo-400/60 hover:from-indigo-500 hover:to-indigo-300/60 transition-all duration-300 cursor-default" />
                </div>
                <span className="text-xs text-slate-500 font-medium">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'rfqs', label: "RFQ's", icon: FileText },
  { id: 'quotations', label: 'Quotations', icon: GitCompare },
  { id: 'approvals', label: 'Approvals', icon: Shield },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function Sidebar({ activeView, setActiveView, userName }) {
  return (
    <aside className="w-64 bg-slate-900/80 border-r border-white/5 flex flex-col shrink-0 backdrop-blur-sm">
      {/* Branding */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/25">V</div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">VendorBridge</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveView(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeView === id
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500">Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  // Auth state
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register' | null
  const [userName, setUserName] = useState('');

  // App state
  const [activeView, setActiveView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Global data
  const [vendors, setVendors] = useState(initialVendors);
  const [rfqs, setRfqs] = useState(initialRFQs);
  const [quotations, setQuotations] = useState(initialQuotations);
  const [pos, setPOs] = useState(initialPOs);
  const [invoices] = useState(initialInvoices);
  const [activities] = useState(initialActivities);
  const [approvals, setApprovals] = useState(initialApprovals);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogin = (name) => {
    setUserName(name);
    setAuthScreen(null);
    addToast('Welcome Back', `Signed in as ${name}`, 'success');
  };

  const handleRegister = (first, last) => {
    setUserName(`${first} ${last}`);
    setAuthScreen(null);
    addToast('Account Created', `Welcome to VendorBridge, ${first}!`, 'success');
  };

  // ── AUTH SCREENS ──
  if (authScreen === 'login') {
    return (
      <>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        <Toast toasts={toasts} removeToast={removeToast} />
        <LoginScreen onLogin={handleLogin} onGoToRegister={() => setAuthScreen('register')} />
      </>
    );
  }

  if (authScreen === 'register') {
    return (
      <>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
        <Toast toasts={toasts} removeToast={removeToast} />
        <RegistrationScreen onRegister={handleRegister} onGoToLogin={() => setAuthScreen('login')} />
      </>
    );
  }

  // ── MAIN APP ──
  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard userName={userName} vendors={vendors} rfqs={rfqs} pos={pos} activities={activities} setActiveView={setActiveView} addToast={addToast} />;
      case 'vendors': return <VendorsPage vendors={vendors} setVendors={setVendors} addToast={addToast} />;
      case 'rfqs': return <RFQManager rfqs={rfqs} setRfqs={setRfqs} vendors={vendors} addToast={addToast} />;
      case 'quotations': return <QuotationsPage quotations={quotations} setQuotations={setQuotations} rfqs={rfqs} setRfqs={setRfqs} setPOs={setPOs} pos={pos} vendors={vendors} addToast={addToast} />;
      case 'approvals': return <ApprovalsPage approvals={approvals} setApprovals={setApprovals} pos={pos} setPOs={setPOs} addToast={addToast} />;
      case 'purchase-orders': return <PurchaseOrdersPage pos={pos} setPOs={setPOs} invoices={invoices} addToast={addToast} />;
      case 'invoices': return <InvoicesPage invoices={invoices} addToast={addToast} />;
      case 'reports': return <ReportsPage vendors={vendors} pos={pos} />;
      case 'activity': return <ActivityLogsPage activities={activities} />;
      default: return <Dashboard userName={userName} vendors={vendors} rfqs={rfqs} pos={pos} activities={activities} setActiveView={setActiveView} addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <Toast toasts={toasts} removeToast={removeToast} />
      <Sidebar activeView={activeView} setActiveView={setActiveView} userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1400px] mx-auto">{renderView()}</div>
      </main>
    </div>
  );
}
