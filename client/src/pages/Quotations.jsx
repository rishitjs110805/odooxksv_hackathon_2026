import { useEffect, useState } from 'react';
import { GitCompare, Plus, ArrowLeft, ArrowUp } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Textarea, Empty, fmt, fmtDate } from '../components/ui';

const TABS = ['Submit Quotation', 'Compare Quotes'];

export default function Quotations({ user, addToast }) {
  const [rfqs, setRfqs] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [rfqDetail, setRfqDetail] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [myVendorId, setMyVendorId] = useState(null);

  const isVendor = user?.role === 'vendor';
  const canManage = ['admin', 'procurement_officer', 'manager'].includes(user?.role);

  const [activeTab, setActiveTab] = useState(isVendor ? 'Submit Quotation' : 'Compare Quotes');

  // Submit form state
  const [form, setForm] = useState({
    vendor_id: '',
    delivery_days: '',
    tax_rate: 18,
    notes: '',
    items: [],
  });

  useEffect(() => {
    api.getRFQs({ status: 'open' }).then(data => {
      setRfqs(data);
      if (data.length > 0) setSelectedRFQ(String(data[0].id));
    }).catch(e => addToast('Error', e.message, 'error'));
    if (isVendor) {
      api.me().then(me =>
        api.getVendors({}).then(list => {
          const mv = list.find(v => v.user_id === me.id);
          if (mv) setMyVendorId(mv.id);
        }).catch(() => {})
      ).catch(() => {});
    } else {
      api.getVendors({ status: 'active' }).then(setVendors).catch(() => {});
    }
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
      setForm(f => ({
        ...f,
        vendor_id: '',
        delivery_days: '',
        notes: '',
        items: rfq.items?.map(it => ({
          rfq_item_id: it.id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit: it.unit || '',
          unit_price: '',
        })) || [],
      }));
    }).catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoadingQ(false));
  }, [selectedRFQ]);

  const setItemPrice = (i, price) => {
    setForm(f => ({
      ...f,
      items: f.items.map((it, idx) => idx !== i ? it : {
        ...it,
        unit_price: price,
      }),
    }));
  };

  const subtotal = form.items.reduce((s, it) => {
    return s + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
  }, 0);
  const taxAmount = Math.round(subtotal * (Number(form.tax_rate) || 0) / 100);
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (asDraft = false) => {
    const status = asDraft ? 'draft' : 'submitted';
    if (!asDraft) {
      if (!form.delivery_days) { addToast('Validation', 'Delivery days required', 'error'); return; }
      if (subtotal === 0) { addToast('Validation', 'Enter at least one item price', 'error'); return; }
      if (!isVendor && !form.vendor_id) { addToast('Validation', 'Select a vendor', 'error'); return; }
    }

    let vendorId = Number(form.vendor_id);
    if (isVendor) {
      if (!myVendorId) { addToast('Error', 'No vendor profile linked to your account', 'error'); return; }
      vendorId = myVendorId;
    }

    setSaving(true);
    try {
      await api.submitQuotation({
        rfq_id: Number(selectedRFQ),
        vendor_id: vendorId,
        total_amount: grandTotal,
        delivery_days: Number(form.delivery_days) || 0,
        notes: form.notes || undefined,
        status,
        items: form.items
          .filter(it => it.unit_price)
          .map(it => ({
            rfq_item_id: it.rfq_item_id,
            unit_price: Number(it.unit_price),
            total_price: Number(it.unit_price) * Number(it.quantity),
          })),
      });
      addToast(
        asDraft ? 'Draft Saved' : 'Quotation Submitted',
        asDraft ? 'Draft saved successfully' : 'Quotation sent for review',
        'success'
      );
      if (!asDraft) setActiveTab('Compare Quotes');
      api.compareQuotations(selectedRFQ).then(setQuotations).catch(() => {});
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

  const lowestPrice = quotations.length ? Math.min(...quotations.map(q => Number(q.total_amount))) : null;

  // ─── RFQ Selector (shared) ──────────────────────────────────────────────────
  const RFQSelector = () => (
    <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
      <label className="text-xs font-medium text-slate-400 shrink-0">RFQ:</label>
      <select
        value={selectedRFQ}
        onChange={e => setSelectedRFQ(e.target.value)}
        className="flex-1 min-w-0 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
      >
        <option value="">— Select an RFQ —</option>
        {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
    </div>
  );

  // ─── Submit Quotation Form (image 6 layout) ─────────────────────────────────
  const SubmitForm = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Submit Quotations</h2>
        {rfqDetail && (
          <p className="text-sm text-slate-400 mt-1">
            RFQ: <span className="text-slate-200">{rfqDetail.title}</span>
            {rfqDetail.deadline && <span className="text-slate-500"> — deadline {fmtDate(rfqDetail.deadline)}</span>}
          </p>
        )}
      </div>

      <RFQSelector />

      {!selectedRFQ ? (
        <Empty icon={GitCompare} message="Select an RFQ to submit a quotation" />
      ) : loadingQ ? <PageLoader /> : (
        <>
          {/* RFQ Summary */}
          {rfqDetail?.items?.length > 0 && (
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-slate-500 mb-1">RFQ Summary</p>
              <p className="text-sm text-slate-300">
                {rfqDetail.items.map(it => `${it.product_name} × ${it.quantity}${it.unit ? ' ' + it.unit : ''}`).join(', ')}
                {rfqDetail.category && <span className="text-slate-500"> — category {rfqDetail.category}</span>}
              </p>
            </div>
          )}

          {/* Vendor selector for non-vendors */}
          {!isVendor && vendors.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Vendor *</label>
              <select
                value={form.vendor_id}
                onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select vendor…</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}

          {/* Your Quotation Table */}
          {form.items.length > 0 && (
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-sm font-semibold text-white">Your Quotation</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/30">
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Item</th>
                      <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Qty</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Unit Price (₹)</th>
                      <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20">
                    {form.items.map((it, i) => {
                      const lineTotal = (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
                      return (
                        <tr key={i}>
                          <td className="px-4 py-3 text-white">{it.product_name}</td>
                          <td className="px-4 py-3 text-right text-slate-300">{it.quantity} {it.unit}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={it.unit_price}
                              onChange={e => setItemPrice(i, e.target.value)}
                              placeholder="0"
                              className="w-36 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {lineTotal > 0 ? fmt(lineTotal) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tax, Notes, Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tax / GST %</label>
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                  className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Delivery Days *</label>
                <input
                  type="number"
                  value={form.delivery_days}
                  onChange={e => setForm(f => ({ ...f, delivery_days: e.target.value }))}
                  placeholder="e.g. 14"
                  className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <Textarea
                label="Note / Terms"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Payment terms: 20 days net..."
                rows={3}
              />
            </div>

            {/* Totals */}
            <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-5 self-start">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">GST ({form.tax_rate}%)</span>
                  <span className="text-white font-medium">{fmt(taxAmount)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-white">Grand Total</span>
                  <span className="text-base font-bold text-indigo-400">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Btn variant="primary" onClick={() => handleSubmit(false)} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Quotation'}
            </Btn>
            <Btn variant="secondary" onClick={() => handleSubmit(true)} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </Btn>
          </div>
        </>
      )}
    </div>
  );

  // ─── Compare Quotes View ────────────────────────────────────────────────────
  const CompareView = () => (
    <div className="space-y-5">
      <RFQSelector />

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
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Amount</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Delivery</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Notes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                  {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {quotations.map(q => {
                  const isLowest = Number(q.total_amount) === lowestPrice;
                  return (
                    <tr key={q.id} className={`hover:bg-slate-700/20 transition-colors ${isLowest ? 'bg-emerald-500/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{q.vendor_name}</span>
                          {isLowest && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs font-medium">
                              <ArrowUp size={10} /> Best Price
                            </span>
                          )}
                        </div>
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
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader title="Quotations" subtitle="Submit and compare vendor quotations">
        {(canManage || isVendor) && selectedRFQ && (
          <Btn variant="primary" onClick={() => setActiveTab('Submit Quotation')}>
            <Plus size={15} /> Submit Quotation
          </Btn>
        )}
      </SectionHeader>

      {/* Tabs — hidden for vendor (always shows submit form) */}
      {!isVendor && (
        <div className="flex gap-1 bg-slate-800 border border-slate-700/50 rounded-lg p-1 self-start w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Submit Quotation' ? <SubmitForm /> : <CompareView />}
    </div>
  );
}
