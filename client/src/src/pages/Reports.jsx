import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatCard, Empty, fmt, fmtDate } from '../components/ui';

export default function Reports({ addToast }) {
  const [stats, setStats] = useState(null);
  const [vendorPerf, setVendorPerf] = useState([]);
  const [spending, setSpending] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProcurementStats(),
      api.getVendorPerformance(),
      api.getSpendingSummary(),
    ]).then(([s, vp, sp]) => {
      setStats(s);
      setVendorPerf(vp);
      setSpending(sp);
    }).catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Analytics" subtitle="Procurement insights and performance metrics" />

      {/* Procurement Stats */}
      {stats && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Procurement Overview</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total RFQs"         value={stats.total_rfqs}           color="blue"   icon={BarChart3}   />
            <StatCard label="Open RFQs"           value={stats.open_rfqs}            color="indigo" icon={BarChart3}   />
            <StatCard label="Total Quotations"    value={stats.total_quotations}     color="purple" icon={TrendingUp}  />
            <StatCard label="Accepted Quotations" value={stats.accepted_quotations}  color="emerald" icon={TrendingUp} />
            <StatCard label="Active POs"          value={stats.active_pos}           color="amber"  icon={BarChart3}   />
            <StatCard label="Paid Invoices"       value={stats.paid_invoices}        color="emerald" icon={BarChart3}  />
            <StatCard label="Total Paid"          value={fmt(stats.total_paid_amount)} color="emerald" icon={TrendingUp} />
            <StatCard label="Pending Approvals"   value={stats.pending_approvals}    color="amber"  icon={BarChart3}   />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Trends */}
        {spending?.monthly_trends?.length > 0 && (
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Monthly Spending</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
            </div>
            <div className="divide-y divide-slate-700/30">
              {spending.monthly_trends.map((m, i) => {
                const max = Math.max(...spending.monthly_trends.map(x => Number(x.total_spend)));
                const pct = max > 0 ? (Number(m.total_spend) / max) * 100 : 0;
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-20 shrink-0">
                      {new Date(m.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                    </span>
                    <div className="flex-1 bg-slate-900 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-white w-24 text-right shrink-0">{fmt(m.total_spend)}</span>
                    <span className="text-xs text-slate-500 w-14 text-right shrink-0">{m.invoice_count} inv</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spend by Category */}
        {spending?.by_category?.length > 0 && (
          <div className="bg-slate-800 border border-slate-700/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Spend by Category</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
              {spending.by_category.map((c, i) => {
                const max = Math.max(...spending.by_category.map(x => Number(x.total_value)));
                const pct = max > 0 ? (Number(c.total_value) / max) * 100 : 0;
                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{c.category || 'Uncategorized'}</span>
                    <div className="flex-1 bg-slate-900 rounded-full h-2">
                      <div className={`${colors[i % colors.length]} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-white w-24 text-right shrink-0">{fmt(c.total_value)}</span>
                    <span className="text-xs text-slate-500 w-12 text-right shrink-0">{c.po_count} PO</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vendor Performance */}
      {vendorPerf.length > 0 && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-white">Vendor Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  {['Vendor', 'Category', 'Quotations', 'Win Rate', 'Total POs', 'PO Value', 'Avg Delivery'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {vendorPerf.map(v => {
                  const winRate = v.total_quotations > 0 ? Math.round((v.accepted_quotations / v.total_quotations) * 100) : 0;
                  return (
                    <tr key={v.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-white">{v.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{v.category || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{v.total_quotations}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-700 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${winRate}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{winRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{v.total_pos}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{fmt(v.total_po_value)}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{v.avg_delivery_days ? `${Number(v.avg_delivery_days).toFixed(0)} days` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vendorPerf.length === 0 && spending?.monthly_trends?.length === 0 && (
        <Empty icon={BarChart3} message="No analytics data yet. Complete some procurement cycles to see reports." />
      )}
    </div>
  );
}
