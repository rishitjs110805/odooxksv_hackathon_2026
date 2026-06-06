import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[300px] max-w-sm ${
          t.type === 'success'
            ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-500/40 text-gray-800 dark:text-slate-100'
            : t.type === 'error'
              ? 'bg-white dark:bg-slate-800 border-red-300 dark:border-red-500/40 text-gray-800 dark:text-slate-100'
              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100'
        }`}>
          {t.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
           : t.type === 'error'  ? <XCircle size={18} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
           : <AlertCircle size={18} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t.title}</p>
            {t.message && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 shrink-0"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

const STATUS_STYLES = {
  draft:        'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25',
  open:         'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
  closed:       'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25',
  cancelled:    'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
  approved:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  pending:      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
  rejected:     'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
  active:       'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  inactive:     'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25',
  blacklisted:  'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
  submitted:    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
  under_review: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25',
  accepted:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  issued:       'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/25',
  delivered:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  generated:    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
  sent:         'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25',
  paid:         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return <div className={`${s} border-2 border-blue-500 dark:border-indigo-500 border-t-transparent rounded-full animate-spin`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export function Empty({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={36} className="text-gray-300 dark:text-slate-600 mb-3" />}
      <p className="text-gray-400 dark:text-slate-400 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl shadow-sm dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  );
}

export function Btn({ variant = 'primary', size = 'md', children, className = '', ...props }) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white',
    secondary: 'bg-white hover:bg-gray-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-100 border border-gray-200 dark:border-slate-600',
    danger:    'bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30',
    ghost:     'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700',
    success:   'bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:    'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
    indigo:  'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10',
    emerald: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
    amber:   'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
    purple:  'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10',
    red:     'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
  };
  const cfg = colors[color] || colors.blue;
  const iconCls = cfg.split(' ').slice(0, 2).join(' ');
  const bgCls = cfg.split(' ').slice(2, 4).join(' ') || cfg;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgCls}`}>
            <Icon size={16} className={iconCls} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

export function Table({ headers, children, empty }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700/50">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/30">
            {children}
          </tbody>
        </table>
        {empty}
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function VendorAvatar({ vendor, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  const initials = vendor?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (vendor?.photo_url) {
    return <img src={vendor.photo_url} alt={vendor.name} className={`${sizes[size]} rounded-lg object-cover border border-gray-200 dark:border-slate-700`} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />;
  }
  return (
    <div className={`${sizes[size]} rounded-lg bg-blue-50 dark:bg-indigo-500/10 border border-blue-100 dark:border-indigo-500/20 flex items-center justify-center font-semibold text-blue-600 dark:text-indigo-400`}>
      {initials}
    </div>
  );
}

export function fmt(num) {
  if (num === null || num === undefined) return '—';
  const n = Number(num);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
