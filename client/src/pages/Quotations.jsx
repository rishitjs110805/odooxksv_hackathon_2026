import { useEffect, useState } from 'react';
import { GitCompare, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Textarea, Empty, fmt, fmtDate } from '../components/ui';

const TABS = ['Submit Quotation', 'Compare Quotes'];

const CRITERIA = [
  { label: 'Grand Total',     value: q => fmt(q.total_amount), highlight: true },
  { label: 'GST %',           value: () => '18%' },
  { label: 'Delivery (days)', value: q => `${q.delivery_days} days` },
  { label: 'Rating',          value: () => '—' },
  { label: 'Payment Terms',   value: q => q.notes || '—' },
];

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
      api.getVendorMe().then(v => {
        if (v?.id) setMyVendorId(v.id);
      }).catch(() => {});
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
      items: f.items.map((it, idx) => idx !== i ? it : { ...it, unit_price: price }),
    }));
  };

  const subtotal = form.items.reduce((s, it) =>
    s + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0), 0);
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

  const handleInitiateApproval = async (quotation) => {
    try {
      await api.initiateApproval(quotation.id);
      addToast('Approval Initiated', 'Sent to manager for approval', 'success');
      api.compareQuotations(selectedRFQ).then(setQuotations).catch(() => {});
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const lowestPrice = quotations.length
    ? Math.min(...quotations.map(q => Number(q.total_amount)))
    : null;

  const selectCls = "flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500";

  const RFQSelector = () => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap shadow-sm dark:shadow-none">
      <label className="text-xs font-medium text-gray-500 dark:text-slate-400 shrink-0">RFQ:</label>
      <select value={selectedRFQ} onChange={e => setSelectedRFQ(e.target.value)} className={selectCls}>
        <option value="">— Select an RFQ —</option>
        {rfqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
    </div>
  );

  const SubmitForm = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit Quotation</h2>
        {rfqDetail && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            RFQ: <span className="text-gray-800 dark:text-slate-200">{rfqDetail.title}</span>
            {rfqDetail.deadline && <span className="text-gray-400 dark:text-slate-500"> — deadline {fmtDate(rfqDetail.deadline)}</span>}
          </p>
        )}
      </div>

      <RFQSelector />

      {!selectedRFQ ? (
        <Empty icon={GitCompare} message="Select an RFQ to submit a quotation" />
      ) : loadingQ ? <PageLoader /> : (
        <>
          {rfqDetail?.items?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3 shadow-sm dark:shadow-none">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-1">RFQ Summary</p>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                {rfqDetail.items.map(it => `${it.product_name} × ${it.quantity}${it.unit ? ' ' + it.unit : ''}`).join(', ')}
                {rfqDetail.category && <span className="text-gray-400 dark:text-slate-500"> — {rfqDetail.category}</span>}
              </p>
            </div>
          )}

          {!isVendor && vendors.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Vendor *</label>
              <select
                value={form.vendor_id}
                onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
              >
                <option value="">Select vendor…</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          )}

          {form.items.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Quotation</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700/30">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-500 px-4 py-2.5 uppercase">Item</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-500 px-4 py-2.5 uppercase">Qty</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-500 px-4 py-2.5 uppercase">Unit Price (₹)</th>
                      <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-500 px-4 py-2.5 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/20">
                    {form.items.map((it, i) => {
                      const lineTotal = (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
                      return (
                        <tr key={i}>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{it.product_name}</td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-300">{it.quantity} {it.unit}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={it.unit_price}
                              onChange={e => setItemPrice(i, e.target.value)}
                              placeholder="0"
                              className="w-36 px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Tax / GST %</label>
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
                  className="w-32 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Delivery Days *</label>
                <input
                  type="number"
                  value={form.delivery_days}
                  onChange={e => setForm(f => ({ ...f, delivery_days: e.target.value }))}
                  placeholder="e.g. 14"
                  className="w-32 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
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

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 self-start shadow-sm dark:shadow-none">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">GST ({form.tax_rate}%)</span>
                  <span className="text-gray-900 dark:text-white font-medium">{fmt(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Grand Total</span>
                  <span className="text-base font-bold text-blue-600 dark:text-indigo-400">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

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

  const CompareView = () => (
    <div className="space-y-5">
      <RFQSelector />

      {!selectedRFQ ? (
        <Empty icon={GitCompare} message="Select an RFQ to compare quotations" />
      ) : loadingQ ? <PageLoader /> : quotations.length === 0 ? (
        <Empty icon={GitCompare} message="No quotations received for this RFQ" />
      ) : (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700/50">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-500 px-5 py-3.5 uppercase tracking-wide bg-gray-50 dark:bg-slate-800/80 w-36">
                      Criteria
                    </th>
                    {quotations.map(q => {
                      const isLowest = Number(q.total_amount) === lowestPrice;
                      return (
                        <th key={q.id} className={`text-left px-5 py-3.5 ${isLowest ? 'bg-emerald-50 dark:bg-emerald-500/5' : 'bg-gray-50 dark:bg-slate-800/80'}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{q.vendor_name}</span>
                            {isLowest && (
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                                Lowest
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/20">
                  {CRITERIA.map((crit, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50/50 dark:bg-slate-800/20' : ''}>
                      <td className="px-5 py-3.5 text-xs font-medium text-gray-500 dark:text-slate-500">{crit.label}</td>
                      {quotations.map(q => {
                        const isLowest = Number(q.total_amount) === lowestPrice;
                        return (
                          <td key={q.id} className={`px-5 py-3.5 ${isLowest ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}>
                            <span className={`text-sm font-medium ${
                              crit.highlight && isLowest ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {crit.value(q)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {canManage && (
                    <tr>
                      <td className="px-5 py-4" />
                      {quotations.map(q => {
                        const isLowest = Number(q.total_amount) === lowestPrice;
                        const canSelect = ['submitted', 'under_review'].includes(q.status);
                        return (
                          <td key={q.id} className={`px-5 py-4 ${isLowest ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}>
                            {canSelect ? (
                              isLowest ? (
                                <button
                                  onClick={() => handleInitiateApproval(q)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                >
                                  Select & Approve
                                </button>
                              ) : (
                                <Btn variant="secondary" size="sm" onClick={() => handleInitiateApproval(q)}>
                                  Select
                                </Btn>
                              )
                            ) : (
                              <StatusBadge status={q.status} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700/30 bg-gray-50 dark:bg-slate-800/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-600/80">
                Green = lowest price. Selecting a vendor initiates the approval workflow.
              </p>
            </div>
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

      {!isVendor && (
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-lg p-1 self-start w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t
                  ? 'bg-blue-600 dark:bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
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
