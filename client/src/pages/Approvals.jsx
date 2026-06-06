import { useEffect, useState, useCallback } from 'react';
import { Check, Clock, X, AlertTriangle, FileSearch } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Btn, Empty, fmt, fmtDate } from '../components/ui';

function ApprovalTimeline({ status }) {
  const STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'Generate PO'];
  const isRejected = status === 'rejected';
  const current = status === 'approved' ? 4 : isRejected ? 2 : 3;

  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current && !isRejected;
        const active = n === current;
        const rejected = isRejected && active;
        return (
          <div key={n} className="flex items-center shrink-0">
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold border-2 transition-colors ${
                done        ? 'bg-emerald-600 border-emerald-600 text-white'
                : rejected  ? 'bg-red-50 dark:bg-red-500/15 border-red-500 text-red-500 dark:text-red-400'
                : active    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                            : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 bg-transparent'
              }`}>
                {done ? <Check size={16} /> : rejected ? <X size={16} /> : <span className="text-sm">{n}</span>}
              </div>
              <span className={`text-xs mt-1.5 text-center whitespace-nowrap ${
                active ? (rejected ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400')
                : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 mx-1 mb-5 shrink-0 ${done ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Approvals({ user, addToast, onAction }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [processing, setProcessing] = useState(false);

  const isManager = ['admin', 'manager'].includes(user?.role);
  const canCreate = ['admin', 'procurement_officer', 'manager'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    api.getApprovals()
      .then(data => {
        setApprovals(data);
        if (data.length > 0) {
          setSelected(prev => {
            const still = data.find(a => a.id === prev?.id);
            return still || data.find(a => a.status === 'pending') || data[0];
          });
        }
      })
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  const handleAction = async (approval, status) => {
    setProcessing(true);
    try {
      await api.processApproval(approval.id, status, remarks[approval.id] || '');
      addToast(
        status === 'approved' ? 'Approved' : 'Rejected',
        approval.rfq_title,
        'success'
      );
      load();
      if (onAction) onAction();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleGeneratePO = async (approval) => {
    setProcessing(true);
    try {
      await api.createPO({ quotation_id: approval.quotation_id });
      addToast('PO Created', 'Purchase order generated successfully', 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader />;

  if (approvals.length === 0) {
    return (
      <div className="space-y-5">
        <SectionHeader title="Approvals" subtitle="Manage quotation approval workflow" />
        <Empty icon={Check} message="No approvals found" />
      </div>
    );
  }

  const apr = selected || approvals[0];
  const pending = approvals.filter(a => a.status === 'pending');
  const approved = approvals.filter(a => a.status === 'approved');
  const rejected = approvals.filter(a => a.status === 'rejected');
  const managerChecklist = [
    'Confirm the quotation matches the RFQ scope and quantity.',
    'Compare total price against competing vendor quotations.',
    'Check delivery timeline against procurement deadline.',
    'Add remarks for audit trail before approving or rejecting.',
  ];
  const selectedPendingIndex = pending.findIndex(a => a.id === apr?.id);
  const nextPending = selectedPendingIndex >= 0 ? pending[selectedPendingIndex + 1] : pending[0];

  return (
    <div className="space-y-5">
      <SectionHeader title="Approvals" subtitle="Manage quotation approval workflow" />

      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ['Pending Decisions', pending.length,   Clock,       'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'],
            ['Approved Quotes',   approved.length,  Check,       'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'],
            ['Rejected Quotes',   rejected.length,  X,           'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10'],
            ['Total Reviews',     approvals.length, FileSearch,  'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'],
          ].map(([label, value, Icon, tone]) => (
            <div key={label} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
                  <Icon size={17} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {approvals.length > 1 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap shadow-sm dark:shadow-none">
          <label className="text-xs font-medium text-gray-500 dark:text-slate-400 shrink-0">Viewing:</label>
          <select
            value={selected?.id || ''}
            onChange={e => setSelected(approvals.find(a => a.id === Number(e.target.value)))}
            className="flex-1 min-w-0 px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
          >
            {approvals.map(a => (
              <option key={a.id} value={a.id}>
                {a.rfq_title} — {a.vendor_name} ({a.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {apr && (
        <div className="space-y-5">
          {/* Timeline card */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl px-6 py-5 shadow-sm dark:shadow-none">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Approval Workflow</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {apr.rfq_title} — {apr.vendor_name} — {fmt(apr.total_amount)}
              </p>
            </div>
            <ApprovalTimeline status={apr.status} />
          </div>

          {/* Two-column detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Approval chain + actions */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 space-y-5 shadow-sm dark:shadow-none">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Approval Chain</p>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Procurement Team</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">Submitted {fmtDate(apr.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {apr.status === 'approved' ? (
                  <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : apr.status === 'rejected' ? (
                  <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-500/15 border-2 border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <X size={13} className="text-red-500 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-amber-500 bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{apr.approver_name || 'Manager / Finance'}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-500">
                    {apr.status === 'pending'
                      ? 'Awaiting approval'
                      : apr.status === 'approved'
                        ? `Approved on ${fmtDate(apr.updated_at)}`
                        : `Rejected on ${fmtDate(apr.updated_at)}`}
                  </p>
                </div>
              </div>

              {apr.remarks && (
                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Remarks</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{apr.remarks}</p>
                </div>
              )}

              {isManager && apr.status === 'pending' && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2.5 flex gap-2">
                    <AlertTriangle size={15} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-100/80">
                      Manager decision required. Verify vendor fit, pricing, delivery risk, and compliance notes before action.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Approval Remarks</label>
                    <textarea
                      value={remarks[apr.id] || ''}
                      onChange={e => setRemarks(m => ({ ...m, [apr.id]: e.target.value }))}
                      placeholder="Optional remarks or conditions..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="primary" size="sm" onClick={() => handleAction(apr, 'approved')} disabled={processing}>
                      {processing ? '…' : 'Approve'}
                    </Btn>
                    <Btn variant="danger" size="sm" onClick={() => handleAction(apr, 'rejected')} disabled={processing}>
                      {processing ? '…' : 'Reject'}
                    </Btn>
                  </div>
                </div>
              )}

              {canCreate && apr.status === 'approved' && (
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-2">
                  <Btn variant="primary" onClick={() => handleGeneratePO(apr)} disabled={processing}>
                    {processing ? 'Creating PO…' : 'Generate PO'}
                  </Btn>
                  <p className="text-xs text-gray-500 dark:text-slate-500">Creates a purchase order from this approved quotation.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm dark:shadow-none">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-5">Quotation Summary</p>
              <div className="space-y-4">
                {[
                  ['RFQ',           apr.rfq_title],
                  ['Vendor',        apr.vendor_name],
                  ['Total Amount',  fmt(apr.total_amount)],
                  ['Delivery',      `${apr.delivery_days} days`],
                  ['Rating',        '—'],
                  ['Status',        apr.status],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
                    <span className={`text-sm font-medium text-right ${
                      label === 'Total Amount' ? 'text-gray-900 dark:text-white text-base font-bold' : 'text-gray-900 dark:text-white'
                    }`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
