import { useEffect, useState } from 'react';
import { FileText, Clock, Building2, ShoppingCart, Receipt, BarChart3, Plus, Shield } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, StatCard, SectionHeader, StatusBadge, fmt, fmtDate, Btn } from '../components/ui';

export default function Dashboard({ user, setActiveView, addToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const s = data?.stats || {};

  const QUICK_ACTIONS = {
    procurement_officer: [
      { label: 'New RFQ', icon: Plus, view: 'rfqs', variant: 'primary' },
      { label: 'Compare Quotations', icon: FileText, view: 'quotations', variant: 'secondary' },
      { label: 'Add Vendor', icon: Building2, view: 'vendors', variant: 'secondary' },
    ],
    manager: [
      { label: 'Review Approvals', icon: Shield, view: 'approvals', variant: 'primary' },
      { label: 'View Reports', icon: BarChart3, view: 'reports', variant: 'secondary' },
    ],
    admin: [
      { label: 'Manage Users', icon: Shield, view: 'users', variant: 'primary' },
      { label: 'View Analytics', icon: BarChart3, view: 'reports', variant: 'secondary' },
    ],
    vendor: [
      { label: 'My RFQs', icon: FileText, view: 'rfqs', variant: 'primary' },
      { label: 'My Orders', icon: ShoppingCart, view: 'purchase-orders', variant: 'secondary' },
    ],
  };

  const actions = QUICK_ACTIONS[user?.role] || [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle="Here's what's happening with your procurement"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active RFQs"         value={s.active_rfqs ?? '—'}       icon={FileText}     color="blue"   />
        <StatCard label="Pending Approvals"   value={s.pending_approvals ?? '—'} icon={Clock}        color="amber"  />
        <StatCard label="Active Vendors"      value={s.total_vendors ?? '—'}     icon={Building2}    color="indigo" />
        <StatCard label="Purchase Orders"     value={s.total_pos ?? '—'}         icon={ShoppingCart} color="emerald"/>
        <StatCard label="Invoices"            value={s.total_invoices ?? '—'}    icon={Receipt}      color="purple" />
      </div>

      {/* Quick Actions */}
      {actions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {actions.map(a => (
              <Btn key={a.view} variant={a.variant} onClick={() => setActiveView(a.view)}>
                <a.icon size={15} /> {a.label}
              </Btn>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent POs */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Purchase Orders</h3>
            <button onClick={() => setActiveView('purchase-orders')} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
          </div>
          {data?.recent_pos?.length ? (
            <div className="divide-y divide-slate-700/30">
              {data.recent_pos.map(po => (
                <div key={po.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{po.po_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{po.vendor_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{fmt(po.total_amount)}</p>
                    <StatusBadge status={po.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No purchase orders yet</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
            <button onClick={() => setActiveView('invoices')} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
          </div>
          {data?.recent_invoices?.length ? (
            <div className="divide-y divide-slate-700/30">
              {data.recent_invoices.map(inv => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{inv.vendor_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{fmt(inv.total)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
