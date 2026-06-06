import { useEffect, useState } from 'react';
import { FileText, Clock, ShoppingCart, AlertCircle, Plus, Building2, Receipt, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, StatCard, SectionHeader, StatusBadge, Btn, fmt } from '../components/ui';

function SpendingChart({ months }) {
  if (!months.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32">
        <TrendingUp size={22} className="text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">No spending data yet</p>
      </div>
    );
  }
  const maxSpend = Math.max(...months.map(m => Number(m.total_spend) || 0), 1);
  return (
    <div className="flex items-end gap-2" style={{ height: '100px' }}>
      {months.map((m, i) => {
        const pct = ((Number(m.total_spend) || 0) / maxSpend) * 100;
        const label = new Date(m.month).toLocaleString('default', { month: 'short' });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 justify-end h-full">
            <div className="w-full flex flex-col justify-end" style={{ height: '84px' }}>
              <div
                title={fmt(m.total_spend)}
                className="w-full rounded-t bg-indigo-500/60 hover:bg-indigo-500 transition-colors cursor-default"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ user, setActiveView, addToast }) {
  const [data, setData] = useState(null);
  const [spending, setSpending] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));

    if (['admin', 'manager', 'procurement_officer'].includes(user?.role)) {
      api.getSpendingSummary().then(setSpending).catch(() => {});
    }
  }, []);

  if (loading) return <PageLoader />;

  const s = data?.stats || {};
  const months = (spending?.monthly_trends || []).slice(0, 6).reverse();

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle="Today's procurement overview"
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active RFQs"       value={s.active_rfqs ?? 0}           icon={FileText}     color="blue"    />
        <StatCard label="Pending Approvals" value={s.pending_approvals ?? 0}     icon={Clock}        color="amber"   />
        <StatCard label="POs This Month"    value={fmt(s.pos_this_month_amount)} icon={ShoppingCart} color="emerald" />
        <StatCard label="Pending Invoices"  value={s.pending_invoices ?? 0}      icon={AlertCircle}  color="red"     />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Purchase Orders Table — 3 cols */}
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Purchase Orders</h3>
            <button
              onClick={() => setActiveView('purchase-orders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all →
            </button>
          </div>
          {data?.recent_pos?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/30">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase tracking-wide">PO #</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase tracking-wide">Vendor</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase tracking-wide">Amount</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/20">
                  {data.recent_pos.map(po => (
                    <tr key={po.id} className="hover:bg-slate-700/10 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{po.po_number}</td>
                      <td className="px-4 py-3 text-sm text-white">{po.vendor_name}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-white">{fmt(po.total_amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No purchase orders yet</p>
          )}
        </div>

        {/* Spending Trends Chart — 2 cols */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700/50 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Spending Trends</h3>
            <span className="text-xs text-slate-500">Last 6 months</span>
          </div>
          <div className="px-5 py-5">
            <SpendingChart months={months} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role !== 'vendor' && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={() => setActiveView('rfqs')}>
              <Plus size={14} /> New RFQ
            </Btn>
            <Btn variant="secondary" onClick={() => setActiveView('vendors')}>
              <Building2 size={14} /> Add Vendor
            </Btn>
            <Btn variant="secondary" onClick={() => setActiveView('invoices')}>
              <Receipt size={14} /> View Invoices
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
