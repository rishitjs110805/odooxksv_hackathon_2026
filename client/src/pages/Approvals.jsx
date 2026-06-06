import { useEffect, useState } from 'react';
import { Shield, Check, X, Clock } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Modal, Empty, fmt, fmtDate } from '../components/ui';

export default function Approvals({ user, addToast, onAction }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { approval, type: 'approve'|'reject' }
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const isManager = ['admin', 'manager'].includes(user?.role);

  const load = () => {
    setLoading(true);
    const call = isManager ? api.getPendingApprovals() : api.getApprovals();
    call.then(setApprovals)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAction = (approval, type) => {
    setActionModal({ approval, type });
    setRemarks('');
  };

  const handleAction = async () => {
    const { approval, type } = actionModal;
    setSaving(true);
    try {
      await api.processApproval(approval.id, type === 'approve' ? 'approved' : 'rejected', remarks);
      addToast(type === 'approve' ? 'Approved' : 'Rejected', `Approval #${approval.id} ${type === 'approve' ? 'approved' : 'rejected'}`, type === 'approve' ? 'success' : 'error');
      setActionModal(null);
      load();
      onAction?.();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Approvals"
        subtitle={isManager ? 'Pending procurement approvals' : 'Procurement approval status'}
      />

      {/* Summary bar */}
      {approvals.length > 0 && (
        <div className="flex gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-sm">
            <span className="text-amber-400 font-semibold">{approvals.filter(a => a.status === 'pending').length}</span>
            <span className="text-slate-400 ml-1.5">pending</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm">
            <span className="text-emerald-400 font-semibold">{approvals.filter(a => a.status === 'approved').length}</span>
            <span className="text-slate-400 ml-1.5">approved</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm">
            <span className="text-red-400 font-semibold">{approvals.filter(a => a.status === 'rejected').length}</span>
            <span className="text-slate-400 ml-1.5">rejected</span>
          </div>
        </div>
      )}

      {loading ? <PageLoader /> : approvals.length === 0 ? (
        <Empty icon={Shield} message={isManager ? 'No pending approvals' : 'No approvals found'} />
      ) : (
        <div className="space-y-3">
          {approvals.map(apr => (
            <div key={apr.id} className="bg-slate-800 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">Approval #{apr.id}</span>
                    <StatusBadge status={apr.status} />
                    {apr.rfq_title && (
                      <span className="text-xs text-slate-500 truncate">· {apr.rfq_title}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Vendor</p>
                      <p className="text-slate-200 font-medium">{apr.vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-white font-semibold">{fmt(apr.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Submitted</p>
                      <p className="text-slate-300">{fmtDate(apr.created_at)}</p>
                    </div>
                    {apr.status !== 'pending' && (
                      <div>
                        <p className="text-xs text-slate-500">Reviewed</p>
                        <p className="text-slate-300">{fmtDate(apr.updated_at)}</p>
                      </div>
                    )}
                  </div>

                  {apr.remarks && (
                    <div className="bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-400">
                      <span className="text-slate-500">Remarks: </span>{apr.remarks}
                    </div>
                  )}
                </div>

                {isManager && apr.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Btn variant="success" size="sm" onClick={() => openAction(apr, 'approve')}>
                      <Check size={14} /> Approve
                    </Btn>
                    <Btn variant="danger" size="sm" onClick={() => openAction(apr, 'reject')}>
                      <X size={14} /> Reject
                    </Btn>
                  </div>
                )}

                {apr.status === 'pending' && !isManager && (
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                    <Clock size={14} /> Awaiting review
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <Modal
          title={actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
          onClose={() => setActionModal(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setActionModal(null)}>Cancel</Btn>
            <Btn
              variant={actionModal.type === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
              disabled={saving}
            >
              {saving ? 'Processing…' : actionModal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Btn>
          </>}
        >
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-slate-400">Vendor: <span className="text-white">{actionModal.approval.vendor_name}</span></p>
              <p className="text-slate-400">Amount: <span className="text-white font-semibold">{fmt(actionModal.approval.total_amount)}</span></p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder={actionModal.type === 'approve' ? 'e.g. Approved — good value for money' : 'e.g. Price too high, reconsider vendor'}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
