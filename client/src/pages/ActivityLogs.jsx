import { useEffect, useState } from 'react';
import { Activity, FileText, GitCompare, ShoppingCart, Receipt, Shield, Building2, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Empty, Btn } from '../components/ui';

const ENTITY_CFG = {
  rfq:            { icon: FileText,     cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  quotation:      { icon: GitCompare,   cls: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' },
  approval:       { icon: Shield,       cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  purchase_order: { icon: ShoppingCart, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  invoice:        { icon: Receipt,      cls: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
  vendor:         { icon: Building2,    cls: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' },
  user:           { icon: Users,        cls: 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-500/10 border-gray-200 dark:border-slate-500/20' },
};

const FILTER_TABS = [
  { label: 'All',       type: '' },
  { label: 'RFQ',       type: 'rfq' },
  { label: 'Approvals', type: 'approval' },
  { label: 'Invoices',  type: 'invoice' },
  { label: 'Vendors',   type: 'vendor' },
];

const ACTION_DESC = {
  approval_initiated: 'Approval initiated',
  approval_approved:  'Approval approved',
  approval_rejected:  'Approval rejected',
  generated:          'Generated',
  email_sent:         'Email sent',
  invoice_paid:       'Invoice marked as paid',
  invoice_sent:       'Invoice sent',
  invoice_generated:  'Invoice generated',
  invoice_cancelled:  'Invoice cancelled',
  created:            'Created',
  updated:            'Updated',
  deleted:            'Deleted',
};

function describeActivity(log) {
  const d = log.details || {};
  const base = ACTION_DESC[log.action] || log.action.replace(/_/g, ' ');
  const entity = (log.entity_type || '').replace(/_/g, ' ');

  if (log.action === 'generated' && log.entity_type === 'invoice' && d.invoice_number) {
    return `Invoice generated — ${d.invoice_number}`;
  }
  if (log.action === 'email_sent' && d.recipient) {
    return `Invoice email sent to ${d.recipient}`;
  }
  if (log.action === 'approval_initiated' && d.quotation_id) {
    return `Approval initiated — quotation #${d.quotation_id}`;
  }
  if (d.invoice_number) return `${base} — ${d.invoice_number}`;
  if (d.name) return `${base} — ${d.name}`;

  return entity ? `${base} — ${entity}` : base;
}

function fmtDateTime(d) {
  if (!d) return '';
  const date = new Date(d);
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  return `${day} ${month} ${year}, ${time}`;
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

  return (
    <div className="space-y-5">
      <SectionHeader title="Activity & Logs" subtitle="Procurement audit trail" />

      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-lg p-1 self-start w-fit flex-wrap">
        {FILTER_TABS.map(t => (
          <button
            key={t.type}
            onClick={() => setFilterType(t.type)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterType === t.type
                ? 'bg-blue-600 dark:bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && logs.length === 0 ? <PageLoader /> : logs.length === 0 ? (
        <Empty icon={Activity} message="No activity logs found" />
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700/50">
            <p className="text-xs text-gray-400 dark:text-slate-500">{total} total events</p>
          </div>

          <div>
            {logs.map((log, i) => {
              const cfg = ENTITY_CFG[log.entity_type] || {
                icon: Activity,
                cls: 'text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-500/10 border-gray-200 dark:border-slate-500/20',
              };
              const Icon = cfg.icon;
              const desc = describeActivity(log);
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/10 transition-colors ${
                    i < logs.length - 1 ? 'border-b border-gray-50 dark:border-slate-700/30' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${cfg.cls}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{desc}</p>
                    {log.user_name && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">by {log.user_name}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 mt-0.5 whitespace-nowrap">
                    {fmtDateTime(log.created_at)}
                  </span>
                </div>
              );
            })}
          </div>

          {logs.length < total && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700/50">
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
