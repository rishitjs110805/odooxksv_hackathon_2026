import { useEffect, useState } from 'react';
import {
  Bell, Shield, GitCompare, Receipt, FileText, ShoppingCart, Clock, AlertTriangle,
  TrendingUp, CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Empty, Btn } from '../components/ui';

const TYPE_CONFIG = {
  approval: {
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    label: 'Approval',
  },
  quotation: {
    icon: GitCompare,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    label: 'Quotation',
  },
  quotation_update: {
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    label: 'Update',
  },
  invoice: {
    icon: Receipt,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    label: 'Invoice',
  },
  rfq: {
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    label: 'RFQ',
  },
  deadline: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Deadline',
  },
  purchase_order: {
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Purchase Order',
  },
};

const PRIORITY_DOT = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-500',
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

function fmt(num) {
  if (num === null || num === undefined) return null;
  const n = Number(num);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Notifications({ user, setActiveView, addToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['all', 'high', 'medium', 'low'];
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.priority === filter);

  const counts = {
    high: notifications.filter(n => n.priority === 'high').length,
    medium: notifications.filter(n => n.priority === 'medium').length,
    low: notifications.filter(n => n.priority === 'low').length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Notifications"
        subtitle="Your procurement alerts and pending actions"
      />

      {/* Summary row */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'high', label: 'High Priority', color: 'border-red-500/30 bg-red-500/5 text-red-400' },
            { key: 'medium', label: 'Medium', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
            { key: 'low', label: 'Low', color: 'border-slate-600/50 bg-slate-700/20 text-slate-400' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                filter === key ? color : 'border-slate-700/50 bg-slate-800 text-slate-400'
              } hover:opacity-90`}
            >
              <span className="text-xs font-medium">{label}</span>
              <span className={`text-xl font-bold ${filter === key ? '' : 'text-white'}`}>{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {f === 'all' ? `All (${notifications.length})` : f}
          </button>
        ))}
        {notifications.length > 0 && (
          <button
            onClick={() => { setLoading(true); api.getNotifications().then(setNotifications).catch(() => {}).finally(() => setLoading(false)); }}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 bg-slate-800 transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={Bell}
          message={
            notifications.length === 0
              ? "You're all caught up! No pending actions."
              : `No ${filter} priority notifications`
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.rfq;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className="bg-slate-800 border border-slate-700/50 rounded-xl px-5 py-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-white">{notif.title}</span>
                      <span className={`inline-flex items-center gap-1 text-xs text-slate-500`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[notif.priority]}`} />
                        {notif.priority}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${cfg.bg} ${cfg.color} border`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">{notif.message}</p>
                    {notif.amount && (
                      <p className="text-xs text-emerald-400 mt-0.5 font-medium">{fmt(notif.amount)}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-slate-600">{timeAgo(notif.created_at)}</span>
                    {notif.nav && (
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveView(notif.nav)}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        View <ArrowRight size={12} />
                      </Btn>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
