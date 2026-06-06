import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Building2, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Empty, fmt } from '../components/ui';

const BAR_COLORS = [
  'bg-indigo-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
];

function StatCard4({ label, value, sub, color }) {
  const COLOR = {
    teal:   'border-teal-500/20 bg-teal-500/5 text-teal-400',
    blue:   'border-blue-500/20 bg-blue-500/5 text-blue-400',
    amber:  'border-amber-500/20 bg-amber-500/5 text-amber-400',
    red:    'border-red-500/20 bg-red-500/5 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-5 ${COLOR[color] || COLOR.blue}`}>
      <p className={`text-2xl font-bold`}>{value}</p>
      <p className="text-sm font-medium text-white mt-1">{label}</p>
      {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  );
}

function MonthlyBars({ trends }) {
  const months = [...trends].reverse().slice(0, 7);
  const maxSpend = Math.max(...months.map(m => Number(m.total_spend) || 0), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {months.map((m, i) => {
        const pct = ((Number(m.total_spend) || 0) / maxSpend) * 100;
        const label = new Date(m.month).toLocaleString('default', { month: 'short' });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 justify-end h-full">
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
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

  const hasData = stats || spending?.monthly_trends?.length || vendorPerf.length;

  const handleExport = () => {
    if (!spending) return;
    const rows = [
      ['Category', 'Total Spend (₹)', 'PO Count'],
      ...(spending.by_category || []).map(c => [
        c.category || 'Uncategorized',
        Number(c.total_value).toFixed(2),
        c.po_count,
      ]),
      [],
      ['Monthly Trend'],
      ['Month', 'Total Spend (₹)', 'Invoice Count'],
      ...(spending.monthly_trends || []).map(m => [
        new Date(m.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        Number(m.total_spend).toFixed(2),
        m.invoice_count,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'procurement_report.csv';
    link.click();
  };

  const now = new Date();
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const topVendors = vendorPerf
    .filter(v => Number(v.total_po_value) > 0)
    .slice(0, 5);

  const byCategory = (spending?.by_category || []).slice(0, 6);
  const maxCatValue = byCategory.length
    ? Math.max(...byCategory.map(c => Number(c.total_value)), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports &amp; analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Procurement Insights — {monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {!hasData ? (
        <Empty icon={BarChart3} message="No analytics data yet. Complete some procurement cycles to see reports." />
      ) : (
        <>
          {/* 4 Stat Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard4
                label="Total Spend"
                value={fmt(stats.total_spend)}
                color="teal"
              />
              <StatCard4
                label="Active Vendors"
                value={stats.active_vendors ?? 0}
                color="blue"
              />
              <StatCard4
                label="PO Fulfillment"
                value={`${stats.po_fulfillment_pct ?? 0}%`}
                sub={`${stats.accepted_quotations} of ${stats.total_quotations} quotations`}
                color="amber"
              />
              <StatCard4
                label="Overdue Invoices"
                value={stats.overdue_invoices ?? 0}
                sub="Past 30-day payment term"
                color="red"
              />
            </div>
          )}

          {/* Spend by Category + Top Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Spend by Category */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spend by Category</h3>
              </div>
              {byCategory.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No category data yet</p>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {byCategory.map((c, i) => {
                    const pct = (Number(c.total_value) / maxCatValue) * 100;
                    return (
                      <div key={i} className="px-5 py-3 flex items-center gap-4">
                        <span className="text-xs text-slate-400 w-24 shrink-0 truncate">
                          {c.category || 'Uncategorized'}
                        </span>
                        <div className="flex-1 bg-slate-900 rounded-full h-2">
                          <div
                            className={`${BAR_COLORS[i % BAR_COLORS.length]} h-2 rounded-full transition-all`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-20 text-right shrink-0">
                          {fmt(c.total_value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: Top Vendors + Monthly Trend */}
            <div className="space-y-5">
              {/* Top Vendors by Spend */}
              <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700/50">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Vendors by Spend</h3>
                </div>
                {topVendors.length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-slate-500">No vendor data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/30">
                          <th className="text-left text-xs font-medium text-slate-500 px-5 py-2.5 uppercase">Vendor</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-5 py-2.5 uppercase">Spend (₹)</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-5 py-2.5 uppercase">POs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        {topVendors.map(v => (
                          <tr key={v.id} className="hover:bg-slate-700/10 transition-colors">
                            <td className="px-5 py-3 text-sm text-white">{v.name}</td>
                            <td className="px-5 py-3 text-sm text-right font-medium text-white">
                              {fmt(v.total_po_value)}
                            </td>
                            <td className="px-5 py-3 text-sm text-right text-slate-400">{v.total_pos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Monthly Trend */}
              {spending?.monthly_trends?.length > 0 && (
                <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Trend</h3>
                    <span className="text-xs text-slate-500">Last 7 months</span>
                  </div>
                  <div className="px-5 py-5">
                    <MonthlyBars trends={spending.monthly_trends} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Performance Table */}
          {vendorPerf.length > 0 && (
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/30">
                      {['Vendor', 'Category', 'Quotations', 'Win Rate', 'Total POs', 'PO Value', 'Avg Delivery'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {vendorPerf.map(v => {
                      const winRate = v.total_quotations > 0
                        ? Math.round((v.accepted_quotations / v.total_quotations) * 100)
                        : 0;
                      return (
                        <tr key={v.id} className="hover:bg-slate-700/10 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-white">{v.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{v.category || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{v.total_quotations}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{winRate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">{v.total_pos}</td>
                          <td className="px-4 py-3 text-sm font-medium text-white">{fmt(v.total_po_value)}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {v.avg_delivery_days ? `${Number(v.avg_delivery_days).toFixed(0)} days` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
