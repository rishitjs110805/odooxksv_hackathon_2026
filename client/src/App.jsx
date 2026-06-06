import { useState, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, FileText, GitCompare, ShoppingCart, Receipt, BarChart3,
  Plus, CheckCircle2, XCircle, Clock, Users, DollarSign, TrendingUp,
  Send, Printer, Download, ChevronRight, AlertCircle, Package,
  Building2, Star, ArrowUpRight, ArrowDownRight, Search,
  X, Check, Bell, Calendar, Tag, Zap, Eye, ChevronDown,
  LogIn, UserPlus, Upload, Trash2, Edit, Filter, Shield,
  Activity, FileCheck, ClipboardList, Globe, Phone, Mail,
  Lock, User, Image, ArrowRight, CircleDot, Hash, LogOut,
  TrendingDown, PieChart, BarChart, ThumbsUp, ThumbsDown, Settings
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const initialUsers = [
  { id: 1, name: 'Manav Panchal', email: 'manav@company.com', role: 'procurement_officer', status: 'active', joinDate: '2026-01-15' },
  { id: 2, name: 'Amit Kumar', email: 'amit@company.com', role: 'manager', status: 'active', joinDate: '2026-01-10' },
  { id: 3, name: 'Priya Sharma', email: 'priya@company.com', role: 'admin', status: 'active', joinDate: '2025-06-01' },
  { id: 4, name: 'Rajesh Verma', email: 'rajesh@company.com', role: 'procurement_officer', status: 'active', joinDate: '2026-02-20' },
];

const initialVendors = [
  { id: 1, name: 'Infra Supplies Pvt Ltd', category: 'Hardware', rating: 4.8, onTime: 96, contact: 'vendor@infrasupplies.com', phone: '+91 98765 43210', totalOrders: 42, status: 'active', location: 'Mumbai, India', gst: 'GSTIN:27AADCI1234F1ZH' },
  { id: 2, name: 'Office Furnishings Co', category: 'Furniture', rating: 4.5, onTime: 91, contact: 'sales@officefurnish.com', phone: '+91 87654 32109', totalOrders: 28, status: 'active', location: 'Delhi, India', gst: 'GSTIN:07AADCO5678G2ZK' },
  { id: 3, name: 'DigiParts Industries', category: 'Electronics', rating: 4.2, onTime: 88, contact: 'orders@digiparts.in', phone: '+91 76543 21098', totalOrders: 15, status: 'active', location: 'Bangalore, India', gst: 'GSTIN:29AADDI9999Z1Y2' },
  { id: 4, name: 'GreenSource Materials', category: 'Stationery', rating: 4.6, onTime: 94, contact: 'hello@greensource.com', phone: '+91 65432 10987', totalOrders: 33, status: 'inactive', location: 'Pune, India', gst: 'GSTIN:27AADGS5555Z1X3' },
];

const initialRFQs = [
  { id: 1, title: 'Office Furniture Procurement Q1', category: 'Furniture', quantity: 50, deadline: '2026-06-15', status: 'open', vendors: [2, 4], createdAt: '2026-05-20', description: 'Procurement of ergonomic desks and chairs.', items: [{ name: 'Standing Desk', qty: 30, unit: 'pcs', estCost: 15000 }, { name: 'Ergonomic Chair', qty: 20, unit: 'pcs', estCost: 8000 }] },
  { id: 2, title: 'IT Infrastructure Upgrade', category: 'Hardware', quantity: 100, deadline: '2026-06-30', status: 'open', vendors: [1, 3], createdAt: '2026-05-25', description: 'Server and networking equipment for data center.', items: [{ name: 'Rack Server', qty: 10, unit: 'pcs', estCost: 120000 }, { name: 'Network Switch', qty: 20, unit: 'pcs', estCost: 25000 }] },
  { id: 3, title: 'Stationery Supply FY26', category: 'Stationery', quantity: 500, deadline: '2026-07-01', status: 'draft', vendors: [], createdAt: '2026-06-01', description: 'Annual stationery procurement.', items: [{ name: 'A4 Paper Reams', qty: 200, unit: 'reams', estCost: 350 }] },
];

const initialQuotations = [
  { id: 1, rfqId: 1, vendorId: 2, vendorName: 'Office Furnishings Co', unitPrice: 14200, totalPrice: 710000, deliveryDays: 14, qualityScore: 92, warranty: '2 Years', notes: 'Includes installation', status: 'submitted', submittedAt: '2026-05-28' },
  { id: 2, rfqId: 1, vendorId: 4, vendorName: 'GreenSource Materials', unitPrice: 13800, totalPrice: 690000, deliveryDays: 21, qualityScore: 87, warranty: '1 Year', notes: 'Bulk discount 5%', status: 'submitted', submittedAt: '2026-05-30' },
  { id: 3, rfqId: 2, vendorId: 1, vendorName: 'Infra Supplies Pvt Ltd', unitPrice: 108000, totalPrice: 1890000, deliveryDays: 10, qualityScore: 95, warranty: '3 Years', notes: 'Premium SLA included', status: 'under_review', submittedAt: '2026-06-01' },
];

const initialApprovals = [
  { id: 1, quotationId: 3, rfqId: 2, poId: 'PO-001', vendorName: 'Infra Supplies Pvt Ltd', amount: 1890000, status: 'pending', approverRole: 'Manager', createdAt: '2026-06-03', remarks: '' },
  { id: 2, quotationId: 1, rfqId: 1, poId: 'PO-002', vendorName: 'Office Furnishings Co', amount: 710000, status: 'approved', approverRole: 'Manager', createdAt: '2026-05-15', remarks: 'Approved - Good pricing' },
];

const initialPOs = [
  { id: 1, poNumber: 'PO-2026-001', rfqId: 3, vendorId: 1, vendorName: 'Infra Supplies Pvt Ltd', amount: 1890000, status: 'approved', createdAt: '2026-05-15', deliveryDate: '2026-06-15', items: [{ name: 'Rack Server', qty: 10, unitPrice: 120000, total: 1200000 }] },
  { id: 2, poNumber: 'PO-2026-002', rfqId: 1, vendorId: 2, vendorName: 'Office Furnishings Co', amount: 710000, status: 'pending', createdAt: '2026-06-03', deliveryDate: '2026-06-20', items: [{ name: 'Standing Desk', qty: 30, unitPrice: 15000, total: 450000 }] },
];

const initialActivities = [
  { id: 1, action: 'RFQ Created', detail: 'RFQ-3 — Stationery Supply created', time: '2 hours ago', type: 'rfq' },
  { id: 2, action: 'Quotation Submitted', detail: 'Infra Supplies submitted quotation for RFQ-2', time: '4 hours ago', type: 'quotation' },
  { id: 3, action: 'PO Approved', detail: 'PO-2026-001 approved — ₹18,90,000', time: '1 day ago', type: 'approval' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md min-w-[340px] ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-100'
          : toast.type === 'error' ? 'bg-red-950/90 border-red-700/50 text-red-100'
          : 'bg-slate-800/90 border-slate-600/50 text-slate-100'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
           : toast.type === 'error' ? <XCircle size={20} className="text-red-400 shrink-0" />
           : <AlertCircle size={20} className="text-blue-400 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    'draft': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    'open': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'closed': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    'approved': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'rejected': 'bg-red-500/15 text-red-400 border-red-500/30',
    'active': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'inactive': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
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
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin, onGoToRegister }) {
  const [role, setRole] = useState('procurement_officer');
  const [userName, setUserName] = useState('Manav Panchal');

  const roleNames = {
    'procurement_officer': 'Procurement Officer',
    'manager': 'Manager / Approver',
    'admin': 'Admin',
    'vendor': 'Vendor'
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl">V</div>
          <h1 className="text-2xl font-bold text-white mt-4">VendorBridge</h1>
          <p className="text-slate-400 text-sm mt-1">Procurement ERP Platform</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white">Sign in</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all">
                {Object.entries(roleNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Username</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your username" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Password</label>
              <input type="password" placeholder="Enter your password" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            </div>

            <button onClick={() => onLogin(userName, role)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 mt-2">
              <LogIn size={16} />
              Login as {roleNames[role]}
            </button>
          </div>

          <div className="text-center text-sm text-slate-400">
            Don't have an account? <button onClick={onGoToRegister} className="text-indigo-400 hover:text-indigo-300 font-semibold">Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  REGISTRATION SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function RegistrationScreen({ onRegister, onGoToLogin }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-2xl">V</div>
          <h1 className="text-2xl font-bold text-white mt-4">VendorBridge</h1>
          <p className="text-slate-400 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl space-y-6">
          <h2 className="text-lg font-semibold text-white">Register</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} placeholder="First" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} placeholder="Last" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="your@email.com" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Create a password" className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            </div>

            <button onClick={() => onRegister(form.firstName, form.lastName)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 mt-2">
              <UserPlus size={16} />
              Create Account
            </button>
          </div>

          <div className="text-center text-sm text-slate-400">
            Already have an account? <button onClick={onGoToLogin} className="text-indigo-400 hover:text-indigo-300 font-semibold">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function Dashboard({ userName, userRole, vendors, rfqs, pos, quotations, approvals, setActiveView, addToast }) {
  const activeRFQs = rfqs.filter(r => r.status === 'open').length;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  const totalSpend = pos.reduce((sum, p) => sum + p.amount, 0);

  const renderRoleContent = () => {
    switch(userRole) {
      case 'procurement_officer':
        return (
          <div className="space-y-8">
            <SectionHeader title={`Welcome, ${userName}`} subtitle="Procurement Officer Dashboard" />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Active RFQs</p>
                    <p className="text-3xl font-bold text-white mt-2">{activeRFQs}</p>
                  </div>
                  <FileText size={24} className="text-indigo-400" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Pending Approvals</p>
                    <p className="text-3xl font-bold text-white mt-2">{pendingApprovals}</p>
                  </div>
                  <Clock size={24} className="text-amber-400" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Spend</p>
                    <p className="text-3xl font-bold text-white mt-2">₹{(totalSpend / 100000).toFixed(1)}L</p>
                  </div>
                  <DollarSign size={24} className="text-emerald-400" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Active Vendors</p>
                    <p className="text-3xl font-bold text-white mt-2">{vendors.filter(v => v.status === 'active').length}</p>
                  </div>
                  <Building2 size={24} className="text-blue-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setActiveView('rfqs')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
                <Plus size={16} /> New RFQ
              </button>
              <button onClick={() => setActiveView('quotations')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all">
                <GitCompare size={16} /> Compare Quotations
              </button>
              <button onClick={() => setActiveView('vendors')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all">
                <UserPlus size={16} /> Add Vendor
              </button>
            </div>
          </div>
        );
      case 'manager':
        return (
          <div className="space-y-8">
            <SectionHeader title={`Welcome, ${userName}`} subtitle="Manager / Approver Dashboard" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-white mt-2">{pendingApprovals}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Total POs</p>
                <p className="text-3xl font-bold text-white mt-2">{pos.length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Approved This Month</p>
                <p className="text-3xl font-bold text-white mt-2">{pos.filter(p => p.status === 'approved').length}</p>
              </div>
            </div>
            <button onClick={() => setActiveView('approvals')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
              <Shield size={16} /> Review Approvals
            </button>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-8">
            <SectionHeader title={`Welcome, ${userName}`} subtitle="Admin Dashboard" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">4</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Total Vendors</p>
                <p className="text-3xl font-bold text-white mt-2">{vendors.length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">Total Spend</p>
                <p className="text-3xl font-bold text-white mt-2">₹{(totalSpend / 100000).toFixed(1)}L</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6">
                <p className="text-sm text-slate-400 font-medium">System Status</p>
                <p className="text-sm text-emerald-400 font-semibold mt-2">Operational</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setActiveView('users')} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
                <Users size={16} /> Manage Users
              </button>
              <button onClick={() => setActiveView('vendors')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all">
                <Building2 size={16} /> Manage Vendors
              </button>
              <button onClick={() => setActiveView('reports')} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold transition-all">
                <BarChart3 size={16} /> View Analytics
              </button>
            </div>
          </div>
        );
      default:
        return <div className="text-slate-400">Role not recognized</div>;
    }
  };

  return renderRoleContent();
}

// ═══════════════════════════════════════════════════════════════════════════
//  RFQ MANAGER
// ═══════════════════════════════════════════════════════════════════════════

function RFQManager({ rfqs, setRfqs, vendors, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', vendors: [], items: [] });
  const [selectedRFQ, setSelectedRFQ] = useState(null);

  const handleCreate = () => {
    if (!form.title || !form.deadline) {
      addToast('Missing Fields', 'Title and deadline required', 'error');
      return;
    }
    const newRFQ = {
      id: Math.max(...rfqs.map(r => r.id || 0), 0) + 1,
      ...form,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      vendors: form.vendors.map(v => parseInt(v))
    };
    setRfqs(prev => [...prev, newRFQ]);
    setForm({ title: '', description: '', deadline: '', vendors: [], items: [] });
    setShowForm(false);
    addToast('RFQ Created', `${newRFQ.title} has been published.`, 'success');
  };

  const rfq = selectedRFQ ? rfqs.find(r => r.id === selectedRFQ) : null;

  return (
    <div className="space-y-8">
      <SectionHeader title="RFQs" subtitle="Request for Quotations">
        <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-4 py-2.5 ${showForm ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20`}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Create RFQ'}
        </button>
      </SectionHeader>

      {showForm && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create New RFQ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Office Furniture Procurement" className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed requirements..." className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none h-24" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Deadline *</label>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold">
                <Plus size={16} /> Create RFQ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rfqs.map(rfq => (
          <div key={rfq.id} className={`bg-slate-800/40 border rounded-2xl p-5 cursor-pointer transition-all ${selectedRFQ === rfq.id ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 hover:border-white/10'}`}
            onClick={() => setSelectedRFQ(selectedRFQ === rfq.id ? null : rfq.id)}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{rfq.title}</h3>
                <p className="text-sm text-slate-400 mt-1">Deadline: {rfq.deadline}</p>
                {selectedRFQ === rfq.id && (
                  <p className="text-sm text-slate-300 mt-2">{rfq.description}</p>
                )}
              </div>
              <StatusBadge status={rfq.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  QUOTATIONS COMPARISON
// ═══════════════════════════════════════════════════════════════════════════

function QuotationsPage({ quotations, rfqs, addToast }) {
  const [selectedRFQ, setSelectedRFQ] = useState(rfqs[0]?.id || 1);
  const relevant = quotations.filter(q => q.rfqId === selectedRFQ);
  const rfq = rfqs.find(r => r.id === selectedRFQ);

  return (
    <div className="space-y-8">
      <SectionHeader title="Quotations" subtitle="Compare vendor responses" />

      <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5">
        <select value={selectedRFQ} onChange={e => setSelectedRFQ(Number(e.target.value))} className="px-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50">
          {rfqs.map(r => <option key={r.id} value={r.id}>{r.id} — {r.title}</option>)}
        </select>
        <p className="text-sm text-slate-400 mt-3">{relevant.length} quotation(s) received</p>
      </div>

      {relevant.length > 0 ? (
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5 bg-slate-900/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Vendor</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Unit Price</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Total</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Delivery</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Quality</th>
              </tr></thead>
              <tbody>
                {relevant.sort((a, b) => a.unitPrice - b.unitPrice).map(q => (
                  <tr key={q.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white font-medium">{q.vendorName}</td>
                    <td className="text-right px-6 py-4 text-sm text-white">₹{q.unitPrice.toLocaleString()}</td>
                    <td className="text-right px-6 py-4 text-sm text-white font-semibold">₹{q.totalPrice.toLocaleString()}</td>
                    <td className="text-right px-6 py-4 text-sm text-slate-300">{q.deliveryDays} days</td>
                    <td className="text-right px-6 py-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${q.qualityScore >= 90 ? 'bg-emerald-500' : q.qualityScore >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${q.qualityScore}%` }} />
                        </div>
                        <span className="text-xs text-slate-300">{q.qualityScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-slate-400">No quotations received yet.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  APPROVALS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function ApprovalsPage({ approvals, setApprovals, addToast }) {
  const handleApprove = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? {...a, status: 'approved'} : a));
    addToast('Approved', `Approval #${id} has been approved.`, 'success');
  };

  const handleReject = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? {...a, status: 'rejected'} : a));
    addToast('Rejected', `Approval #${id} has been rejected.`, 'error');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Approvals" subtitle="Procurement request approvals" />

      <div className="space-y-4">
        {approvals.map(apr => (
          <div key={apr.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white">Approval #{apr.id}</h3>
                  <StatusBadge status={apr.status} />
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>Vendor: <span className="text-white">{apr.vendorName}</span></p>
                  <p>Amount: <span className="text-white font-semibold">₹{apr.amount.toLocaleString()}</span></p>
                </div>
              </div>
              {apr.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(apr.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all">
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => handleReject(apr.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold transition-all">
                    <X size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VENDORS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function VendorsPage({ vendors, setVendors, addToast }) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', email: '', phone: '', location: '', gst: '' });

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.category) {
      addToast('Missing Fields', 'Name and category required', 'error');
      return;
    }
    const newVendor = {
      id: Math.max(...vendors.map(v => v.id || 0), 0) + 1,
      ...form,
      rating: 0,
      onTime: 0,
      totalOrders: 0,
      status: 'active'
    };
    setVendors(prev => [...prev, newVendor]);
    setForm({ name: '', category: '', email: '', phone: '', location: '', gst: '' });
    setShowForm(false);
    addToast('Vendor Added', `${newVendor.name} has been onboarded.`, 'success');
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Vendors" subtitle="Vendor profiles and registrations">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-64" />
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-4 py-2.5 ${showForm ? 'bg-red-600' : 'bg-indigo-600'} hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all`}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Vendor'}
        </button>
      </SectionHeader>

      {showForm && (
        <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Vendor Name" className="px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category" className="px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold">
              <Plus size={16} /> Add Vendor
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5 bg-slate-900/50">
              {['Name', 'Category', 'Contact', 'Location', 'Rating', 'Status'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 text-sm text-white font-medium">{v.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.contact}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.location}</td>
                  <td className="px-6 py-4">
                    {v.rating > 0 ? (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={14} className="fill-amber-400" />
                        <span className="text-sm font-semibold">{v.rating}</span>
                      </div>
                    ) : <span className="text-xs text-slate-500">New</span>}
                  </td>
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
//  USERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function UsersPage({ users, addToast }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors = {
    'admin': 'bg-red-500/10 text-red-400 border-red-500/30',
    'procurement_officer': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'manager': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'vendor': 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="space-y-8">
      <SectionHeader title="Users" subtitle="System user management">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 w-64" />
        </div>
      </SectionHeader>

      <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5 bg-slate-900/50">
              {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 text-sm text-white font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[u.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-300">{u.joinDate}</td>
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
//  REPORTS & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

function ReportsPage({ pos, vendors }) {
  const totalSpend = pos.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-8">
      <SectionHeader title="Reports & Analytics" subtitle="Procurement insights and metrics" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
          <p className="text-sm text-emerald-400 font-medium">Total Spend</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">₹{(totalSpend / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
          <p className="text-sm text-indigo-400 font-medium">Approval Rate</p>
          <p className="text-2xl font-bold text-indigo-400 mt-2">{pos.length > 0 ? Math.round((pos.filter(p => p.status === 'approved').length / pos.length) * 100) : 0}%</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
          <p className="text-sm text-amber-400 font-medium">Active Vendors</p>
          <p className="text-2xl font-bold text-amber-400 mt-2">{vendors.filter(v => v.status === 'active').length}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS_COMMON = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const NAV_ITEMS_PROCUREMENT = [
  { id: 'rfqs', label: 'RFQs', icon: FileText },
  { id: 'quotations', label: 'Quotations', icon: GitCompare },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const NAV_ITEMS_MANAGER = [
  { id: 'approvals', label: 'Approvals', icon: Shield },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const NAV_ITEMS_ADMIN = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'reports', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function Sidebar({ activeView, setActiveView, userName, userRole, onLogout }) {
  const getNavItems = () => {
    const items = [...NAV_ITEMS_COMMON];
    switch(userRole) {
      case 'procurement_officer': return [...items, ...NAV_ITEMS_PROCUREMENT];
      case 'manager': return [...items, ...NAV_ITEMS_MANAGER];
      case 'admin': return [...items, ...NAV_ITEMS_ADMIN];
      default: return items;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-white/5 flex flex-col shrink-0 backdrop-blur-sm">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/25">V</div>
          <h1 className="text-base font-bold text-white">VendorBridge</h1>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveView(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === id ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500 capitalize">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold transition-all">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [authScreen, setAuthScreen] = useState('login');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const [vendors, setVendors] = useState(initialVendors);
  const [rfqs, setRfqs] = useState(initialRFQs);
  const [quotations] = useState(initialQuotations);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [pos, setPOs] = useState(initialPOs);
  const [users] = useState(initialUsers);
  const [activities] = useState(initialActivities);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const handleLogin = (name, role) => {
    setUserName(name);
    setUserRole(role);
    setAuthScreen(null);
    setActiveView('dashboard');
    addToast('Welcome', `Logged in as ${name}`, 'success');
  };

  const handleRegister = (firstName, lastName) => {
    handleLogin(`${firstName} ${lastName}`, 'procurement_officer');
  };

  const handleLogout = () => {
    setUserName('');
    setUserRole('');
    setAuthScreen('login');
    setActiveView('dashboard');
    addToast('Logged Out', 'See you next time!', 'info');
  };

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

  const renderView = () => {
    switch(activeView) {
      case 'dashboard': return <Dashboard userName={userName} userRole={userRole} vendors={vendors} rfqs={rfqs} pos={pos} quotations={quotations} approvals={approvals} setActiveView={setActiveView} addToast={addToast} />;
      case 'rfqs': return <RFQManager rfqs={rfqs} setRfqs={setRfqs} vendors={vendors} addToast={addToast} />;
      case 'quotations': return <QuotationsPage quotations={quotations} rfqs={rfqs} addToast={addToast} />;
      case 'approvals': return <ApprovalsPage approvals={approvals} setApprovals={setApprovals} addToast={addToast} />;
      case 'purchase-orders': return <div className="space-y-8"><SectionHeader title="Purchase Orders" subtitle="PO management and tracking" /><div className="bg-slate-800/40 border border-white/5 rounded-2xl p-8 text-center text-slate-400">Purchase Orders view coming soon...</div></div>;
      case 'vendors': return <VendorsPage vendors={vendors} setVendors={setVendors} addToast={addToast} />;
      case 'users': return <UsersPage users={users} addToast={addToast} />;
      case 'reports': return <ReportsPage pos={pos} vendors={vendors} />;
      case 'activity': return <div className="space-y-8"><SectionHeader title="Activity" subtitle="System activity logs" /><div className="bg-slate-800/40 border border-white/5 rounded-2xl p-8"><div className="space-y-3">{activities.map(a => <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-white/5 rounded-lg"><div className="w-2 h-2 rounded-full bg-indigo-400 mt-2" /><div className="flex-1"><p className="text-sm font-semibold text-white">{a.action}</p><p className="text-xs text-slate-400 mt-1">{a.detail}</p></div><p className="text-xs text-slate-500">{a.time}</p></div>)}</div></div></div>;
      default: return <Dashboard userName={userName} userRole={userRole} vendors={vendors} rfqs={rfqs} pos={pos} quotations={quotations} approvals={approvals} setActiveView={setActiveView} addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <Toast toasts={toasts} removeToast={removeToast} />
      <Sidebar activeView={activeView} setActiveView={setActiveView} userName={userName} userRole={userRole} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1400px] mx-auto">{renderView()}</div>
      </main>
    </div>
  );
}
