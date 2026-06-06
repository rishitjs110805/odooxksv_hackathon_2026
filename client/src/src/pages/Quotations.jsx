import { useEffect, useState } from 'react';
import { GitCompare, Plus, X, ArrowUp } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Input, Textarea, Modal, Empty, fmt } from '../components/ui';

export default function Quotations({ user, addToast }) {
  const [rfqs, setRfqs] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [rfqDetail, setRfqDetail] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ rfq_id: '', vendor_id: '', total_amount: '', delivery_days: '', notes: '', items: [] });
  const [saving, setSaving] = useState(false);

  const isVendor = user?.role === 'vendor';
  const canManage = ['admin', 'procurement_officer', 'manager'].includes(user?.role);

  useEffect(() => {
    api.getRFQs({ status: 'open' }).then(data => {
      setRfqs(data);
      if (data.length > 0) setSelectedRFQ(String(data[0].id));
    }).catch(e => addToast('Error', e.message, 'error'));
    if (!isVendor) api.getVendors({ status: 'active' }).then(setVendors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRFQ) return;
    setLoadingQ(true);
    Promise.all([
      api.compareQuotations(selectedRFQ),
      api.getRFQ(selectedRFQ),
    ]).then(([q, rfq]) => {
      setQuotations(q);
      setRfqDetail(rfq);
    }).catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoadingQ(false));
  }, [selectedRFQ]);

  const lowestPrice = quotations.length ? Math.min(...quotations.map(q => Number(q.total_amount))) : null;

  const openSubmit = () => {
    if (!rfqDetail) return;
    setForm({
      rfq_id: Number(selectedRFQ),
      vendor_id: vendors[0]?.id || '',
      total_amount: '',
      delivery_days: '',
      notes: '',
      items: rfqDetail.items?.map(it => ({ rfq_item_id: it.id, product_name: it.product_name, quantity: it.quantity, unit_price: '', total_price: '' })) || [],
    });
    setShowSubmit(true);
  };

  const setItem = (i, k, v) => {
    setForm(f => {
      const items = f.items.map((it, idx) => {
        if (idx !== i) return it;
        const updated = { ...it, [k]: v };
        if (k === 'unit_price') updated.total_price = (Number(v) * Number(it.quantity || 1)).toFixed(2);
        return updated;
      });
      const total = items.reduce((s, it) => s + (Number(it.total_price) || 0), 0);
      return { ...f, items, total_amount: total.toFixed(2) };
    });
  };

  const handleSubmit = async () => {
    if (!form.vendor_id || !form.total_amount || !form.delivery_days) {
      addToast('Validation', 'Vendor, total amount and delivery days required', 'error'); return;
    }
    setSaving(true);
    try {
      await api.submitQuotation({
        rfq_id: form.rfq_id,
        vendor_id: Number(form.vendor_id),
        total_amount: Number(form.total_amount),
        delivery_days: Number(form.delivery_days),
        notes: form.notes,
        items: form.items.filter(it => it.unit_price).map(it => ({
          rfq_item_id: it.rfq_item_id,
          unit_price: Number(it.unit_price),
          total_price: Number(it.total_price),
        })),
      });
      addToast('Quotation Submitted', 'Your quotation has been sent', 'success');
      setShowSubmit(false);
      if (selectedRFQ) {
        api.compareQuotations(selectedRFQ).then(setQuotations).catch(() => {});
      }
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (quotation, status) => {
    try {
      await api.updateQuotationStatus(quotation.id, status);
      addToast('Updated', `Quotation → ${status}`, 'success');
      api.compareQuotations(selectedRFQ).then(setQuotations).catch(() => {});
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleInitiateApproval = async (quotation) => {
    try {
      await api.initiateApproval(quotation.id);
      addToast('Approval Initiated', 'Sent to manager for approval', 'success');
      api.compareQuotations(selectedRFQ).then(setQuotations).catch(() => {});
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Quotations" subtitle="Compare vendor responses">
        {(isVendor || canManage) && selectedRFQ && (
          <Btn variant="primary" onClick={openSubmit}><Plus size={15} /> Submit Quotation</Btn>
        )}
      </SectionHeader>

      {/* RFQ Selector */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <label className="text-xs font-medium text-slate-400 shrink-0">Select RFQ:</label>
        <select
          value={selectedRFQ}
          onChange={e => setSelectedRFQ(e.target.value)}
          className="flex-1 min-w-0 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option value="">— Select an RFQ —</option>
          {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        {quotations.length > 0 && (
          <span className="text-xs text-slate-500 shrink-0">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {!selectedRFQ ? (
        <Empty icon={GitCompare} message="Select an RFQ to compare quotations" />
      ) : loadingQ ? <PageLoader /> : quotations.length === 0 ? (
        <Empty icon={GitCompare} message="No quotations received for this RFQ" />
      ) : (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Vendor</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Total Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Delivery</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                  {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {quotations.map((q, idx) => {
                  const isLowest = Number(q.total_amount) === lowestPrice;
                  return (
                    <tr key={q.id} className={`hover:bg-slate-700/20 transition-colors ${isLowest ? 'bg-emerald-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">{q.vendor_name}</div>
                          {isLowest && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs font-medium">
                              <ArrowUp size={10} /> Best Price
                            </span>
                          )}
                          {idx === quotations.length - 1 && quotations.length > 1 && (
                            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">Highest</span>
                          )}
                        </div>
                        {q.vendor_email && <p className="text-xs text-slate-500 mt-0.5">{q.vendor_email}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${isLowest ? 'text-emerald-400' : 'text-white'}`}>{fmt(q.total_amount)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-300">{q.delivery_days} days</td>
                      <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">{q.notes || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {q.status === 'submitted' && (
                              <Btn variant="secondary" size="sm" onClick={() => handleStatusChange(q, 'under_review')}>Review</Btn>
                            )}
                            {q.status === 'under_review' && (
                              <Btn variant="primary" size="sm" onClick={() => handleInitiateApproval(q)}>Send for Approval</Btn>
                            )}
                            {q.status === 'submitted' && (
                              <Btn variant="danger" size="sm" onClick={() => handleStatusChange(q, 'rejected')}>Reject</Btn>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Quotation Modal */}
      {showSubmit && (
        <Modal
          title="Submit Quotation"
          onClose={() => setShowSubmit(false)}
          footer={<>
            <Btn variant="secondary" onClick={() => setShowSubmit(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Quotation'}</Btn>
          </>}
        >
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {!isVendor && vendors.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Vendor *</label>
                <select value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option value="">Select vendor…</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Total Amount (₹) *" type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="150000" />
              <Input label="Delivery Days *" type="number" value={form.delivery_days} onChange={e => setForm(f => ({ ...f, delivery_days: e.target.value }))} placeholder="14" />
            </div>

            <Textarea label="Notes / Terms" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Warranty, installation, payment terms…" rows={2} />

            {form.items.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Item Pricing</label>
                <div className="space-y-2">
                  {form.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300 flex-1">{it.product_name} × {it.quantity}</span>
                      <input type="number" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)}
                        placeholder="Unit price"
                        className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                      <span className="text-xs text-slate-400 w-24 text-right">{it.total_price ? fmt(it.total_price) : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
