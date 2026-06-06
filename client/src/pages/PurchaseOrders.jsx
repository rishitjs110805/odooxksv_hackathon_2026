import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Input, Modal, Empty, fmt, fmtDate } from '../components/ui';

export default function PurchaseOrders({ user, addToast, setActiveView }) {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [acceptedQuotations, setAcceptedQuotations] = useState([]);
  const [form, setForm] = useState({ quotation_id: '', delivery_date: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = ['admin', 'procurement_officer', 'manager'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getPOs()
      .then(setPOs)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    try {
      const rfqs = await api.getRFQs();
      const allQ = [];
      for (const rfq of rfqs) {
        const qs = await api.getQuotationsForRFQ(rfq.id).catch(() => []);
        allQ.push(...qs.filter(q => q.status === 'accepted'));
      }
      setAcceptedQuotations(allQ);
      setForm({ quotation_id: allQ[0]?.id || '', delivery_date: '' });
      setShowCreate(true);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleCreate = async () => {
    if (!form.quotation_id) { addToast('Validation', 'Select a quotation', 'error'); return; }
    setSaving(true);
    try {
      await api.createPO({ quotation_id: Number(form.quotation_id), delivery_date: form.delivery_date || undefined });
      addToast('PO Created', 'Purchase Order generated successfully', 'success');
      setShowCreate(false);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = async (po) => {
    if (expanded === po.id) { setExpanded(null); setExpandedDetail(null); return; }
    try {
      const detail = await api.getPO(po.id);
      setExpandedDetail(detail);
      setExpanded(po.id);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleStatusChange = async (po, status) => {
    try {
      await api.updatePOStatus(po.id, status);
      addToast('Updated', `PO ${status}`, 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleGenerateInvoice = async (po) => {
    try {
      await api.generateInvoice(po.id);
      addToast('Invoice Generated', `Invoice created for ${po.po_number}`, 'success');
      setActiveView('invoices');
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Purchase Orders" subtitle="PO management and tracking">
        {canCreate && <Btn variant="primary" onClick={openCreate}><Plus size={15} /> New PO</Btn>}
      </SectionHeader>

      {loading ? <PageLoader /> : pos.length === 0 ? (
        <Empty icon={ShoppingCart} message="No purchase orders yet"
          action={canCreate && <Btn variant="primary" size="sm" onClick={openCreate}><Plus size={13} /> Create PO</Btn>}
        />
      ) : (
        <div className="space-y-2">
          {pos.map(po => (
            <div key={po.id} className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={() => toggleExpand(po)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <ShoppingCart size={15} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{po.po_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{po.vendor_name} · {fmtDate(po.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-white">{fmt(po.total_amount)}</span>
                  <StatusBadge status={po.status} />
                  {expanded === po.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {expanded === po.id && expandedDetail && (
                <div className="border-t border-slate-700/50 px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Vendor</p>
                      <p className="text-slate-200">{expandedDetail.vendor_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">RFQ</p>
                      <p className="text-slate-200 truncate">{expandedDetail.rfq_title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Delivery Date</p>
                      <p className="text-slate-200">{fmtDate(expandedDetail.delivery_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Amount</p>
                      <p className="text-white font-semibold">{fmt(expandedDetail.total_amount)}</p>
                    </div>
                    {expandedDetail.gst_number && (
                      <div>
                        <p className="text-xs text-slate-500">GST</p>
                        <p className="text-slate-400 font-mono text-xs">{expandedDetail.gst_number}</p>
                      </div>
                    )}
                    {expandedDetail.vendor_email && (
                      <div>
                        <p className="text-xs text-slate-500">Vendor Email</p>
                        <p className="text-slate-400 text-xs">{expandedDetail.vendor_email}</p>
                      </div>
                    )}
                  </div>

                  {canCreate && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {po.status === 'issued' && (
                        <Btn variant="success" size="sm" onClick={() => handleStatusChange(po, 'delivered')}>
                          Mark Delivered
                        </Btn>
                      )}
                      {po.status !== 'cancelled' && (
                        <Btn variant="secondary" size="sm" onClick={() => handleGenerateInvoice(po)}>
                          Generate Invoice
                        </Btn>
                      )}
                      {po.status === 'issued' && (
                        <Btn variant="danger" size="sm" onClick={() => handleStatusChange(po, 'cancelled')}>
                          Cancel PO
                        </Btn>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showCreate && (
        <Modal
          title="Create Purchase Order"
          onClose={() => setShowCreate(false)}
          footer={<>
            <Btn variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create PO'}</Btn>
          </>}
        >
          <div className="space-y-4">
            {acceptedQuotations.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">No accepted quotations available.</p>
                <p className="text-slate-500 text-xs mt-1">Accept a quotation from the Quotations page first.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Accepted Quotation *</label>
                  <select
                    value={form.quotation_id}
                    onChange={e => setForm(f => ({ ...f, quotation_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {acceptedQuotations.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.vendor_name} — {fmt(q.total_amount)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Expected Delivery Date"
                  type="date"
                  value={form.delivery_date}
                  onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
                />
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
