import { useEffect, useState } from 'react';
import { Activity, FileText, GitCompare, ShoppingCart, Receipt, Shield, Building2, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Empty, Btn } from '../components/ui';

const ENTITY_ICONS = {
  rfq: FileText,
  quotation: GitCompare,
  approval: Shield,
  purchase_order: ShoppingCart,
  invoice: Receipt,
  vendor: Building2,
  user: Users,
};

const ENTITY_COLORS = {
  rfq: 'text-blue-400 bg-blue-500/10',
  quotation: 'text-indigo-400 bg-indigo-500/10',
  approval: 'text-amber-400 bg-amber-500/10',
  purchase_order: 'text-emerald-400 bg-emerald-500/10',
  invoice: 'text-purple-400 bg-purple-500/10',
  vendor: 'text-pink-400 bg-pink-500/10',
  user: 'text-slate-400 bg-slate-500/10',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityLogs({ addToast }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  const load = (off = 0) => {
    setLoading(true);
    const p = { limit: LIMIT, offset: off };
    if (filterType) p.entity_type = filterType;
    api.getActivity(p)
      .then(data => {
        setTotal(data.total);
        setLogs(off === 0 ? data.items : prev => [...prev, ...data.items]);
        setOffset(off);
      })
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, [filterType]);

  const FILTER_TYPES = ['', 'rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'vendor'];

  return (
    <div className="space-y-5">
      <SectionHeader title="Activity Logs" subtitle="Audit trail of all procurement actions" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filterType === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      {loading && logs.length === 0 ? <PageLoader /> : logs.length === 0 ? (
        <Empty icon={Activity} message="No activity logs found" />
      ) : (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">{total} total events</p>
          </div>

          <div className="divide-y divide-slate-700/30">
            {logs.map((log, i) => {
              const Icon = ENTITY_ICONS[log.entity_type] || Activity;
              const color = ENTITY_COLORS[log.entity_type] || 'text-slate-400 bg-slate-500/10';
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white capitalize">{log.action.replace(/_/g, ' ')}</span>
                      {log.entity_type && (
                        <span className="text-xs text-slate-500 capitalize">· {log.entity_type.replace(/_/g, ' ')} #{log.entity_id}</span>
                      )}
                    </div>
                    {log.user_name && (
                      <p className="text-xs text-slate-500 mt-0.5">by {log.user_name} ({log.user_email})</p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-600 mt-0.5 font-mono truncate">{JSON.stringify(log.details)}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0 mt-0.5">{timeAgo(log.created_at)}</span>
                </div>
              );
            })}
          </div>

          {logs.length < total && (
            <div className="px-5 py-3 border-t border-slate-700/50">
              <Btn variant="ghost" size="sm" onClick={() => load(offset + LIMIT)} disabled={loading}>
                {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
              </Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
