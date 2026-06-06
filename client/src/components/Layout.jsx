import {
  LayoutDashboard, FileText, GitCompare, ShoppingCart, Receipt,
  BarChart3, Shield, Users, Building2, Activity, LogOut, ChevronRight, Settings, Bell
} from 'lucide-react';

const NAV = {
  procurement_officer: [
    { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'rfqs',            label: 'RFQs',             icon: FileText },
    { id: 'quotations',      label: 'Quotations',       icon: GitCompare },
    { id: 'purchase-orders', label: 'Purchase Orders',  icon: ShoppingCart },
    { id: 'invoices',        label: 'Invoices',         icon: Receipt },
    { id: 'vendors',         label: 'Vendors',          icon: Building2 },
    { id: 'notifications',   label: 'Notifications',    icon: Bell },
    { id: 'activity',        label: 'Activity',         icon: Activity },
  ],
  manager: [
    { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'approvals',       label: 'Approvals',        icon: Shield },
    { id: 'quotations',      label: 'Quotations',       icon: GitCompare },
    { id: 'rfqs',            label: 'RFQs',             icon: FileText },
    { id: 'vendors',         label: 'Vendors',          icon: Building2 },
    { id: 'purchase-orders', label: 'Purchase Orders',  icon: ShoppingCart },
    { id: 'invoices',        label: 'Invoices',         icon: Receipt },
    { id: 'notifications',   label: 'Notifications',    icon: Bell },
    { id: 'reports',         label: 'Reports',          icon: BarChart3 },
    { id: 'activity',        label: 'Activity',         icon: Activity },
  ],
  admin: [
    { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'users',           label: 'Users',            icon: Users },
    { id: 'vendors',         label: 'Vendors',          icon: Building2 },
    { id: 'rfqs',            label: 'RFQs',             icon: FileText },
    { id: 'quotations',      label: 'Quotations',       icon: GitCompare },
    { id: 'approvals',       label: 'Approvals',        icon: Shield },
    { id: 'purchase-orders', label: 'Purchase Orders',  icon: ShoppingCart },
    { id: 'invoices',        label: 'Invoices',         icon: Receipt },
    { id: 'notifications',   label: 'Notifications',    icon: Bell },
    { id: 'reports',         label: 'Analytics',        icon: BarChart3 },
    { id: 'activity',        label: 'Activity',         icon: Activity },
  ],
  vendor: [
    { id: 'dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
    { id: 'rfqs',            label: 'My RFQs',          icon: FileText },
    { id: 'quotations',      label: 'My Quotations',    icon: GitCompare },
    { id: 'purchase-orders', label: 'My Orders',        icon: ShoppingCart },
    { id: 'invoices',        label: 'My Invoices',      icon: Receipt },
    { id: 'notifications',   label: 'Notifications',    icon: Bell },
  ],
};

const ROLE_LABELS = {
  admin: 'Admin',
  procurement_officer: 'Procurement Officer',
  manager: 'Manager',
  vendor: 'Vendor',
};

export function Sidebar({ activeView, setActiveView, user, onLogout, pendingCount = 0 }) {
  const items = NAV[user?.role] || [];
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <div>
            <p className="text-sm font-semibold text-white">VendorBridge</p>
            <p className="text-xs text-slate-500">Procurement ERP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          const showBadge = (id === 'approvals' || id === 'notifications') && pendingCount > 0;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {showBadge && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {isActive && !showBadge && <ChevronRight size={14} className="text-indigo-400" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-0.5">
        <button
          onClick={() => setActiveView('profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
            activeView === 'profile' ? 'bg-indigo-600/15' : 'hover:bg-slate-800'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role]}</p>
          </div>
          <Settings size={13} className="text-slate-600 shrink-0" />
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
