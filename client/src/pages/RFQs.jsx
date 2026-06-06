import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, ChevronDown, ChevronUp, Calendar, X, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Input, Textarea, Modal, Empty, fmtDate } from '../components/ui';

const EMPTY_FORM = { title: '', description: '', category: '', deadline: '', status: 'open', vendor_ids: [], items: [] };
const EMPTY_ITEM = { product_name: '', quantity: '', unit: '' };

const CATEGORIES = ['Electronics', 'Furniture', 'Hardware', 'Stationery', 'IT Services', 'Logistics', 'Consumables', 'Constructions', 'Other'];

function StepIndicator({ step = 1 }) {
  const steps = ['RFQ Details', 'Items & Vendors', 'Review'];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                done ? 'bg-blue-600 dark:bg-indigo-600 border-blue-600 dark:border-indigo-600 text-white'
                     : active ? 'border-blue-500 dark:border-indigo-500 text-blue-600 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-500/10'
                               : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 bg-transparent'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-1 mb-4 ${done ? 'bg-blue-600 dark:bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RFQs({ user, addToast }) {
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = ['admin', 'procurement_officer'].includes(user?.role);

  const load = () => {
    setLoading(true);
    const p = filterStatus ? { status: filterStatus } : {};
    api.getRFQs(p)
      .then(setRfqs)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);
  useEffect(() => {
    if (canCreate) api.getVendors({ status: 'active' }).then(setVendors).catch(() => {});
  }, [canCreate]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, k, v) => setForm(f => ({
    ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it),
  }));

  const toggleVendor = (id) => setForm(f => ({
    ...f,
    vendor_ids: f.vendor_ids.includes(id)
      ? f.vendor_ids.filter(v => v !== id)
      : [...f.vendor_ids, id],
  }));

  const handleCreate = async (asDraft = false) => {
    if (!form.title || !form.deadline) { addToast('Validation', 'Title and deadline required', 'error'); return; }
    setSaving(true);
    try {
      const status = asDraft ? 'draft' : 'open';
      await api.createRFQ({
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        deadline: form.deadline,
        status,
        vendor_ids: form.vendor_ids,
        items: form.items.filter(it => it.product_name).map(it => ({
          product_name: it.product_name,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || undefined,
        })),
      });
      addToast('RFQ Created', form.title + (asDraft ? ' saved as draft' : ' sent to vendors'), 'success');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (rfq, status) => {
    try {
      await api.updateRFQStatus(rfq.id, status);
      addToast('Updated', `RFQ → ${status}`, 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteRFQ(deleteTarget.id);
      addToast('Deleted', deleteTarget.title, 'success');
      setDeleteTarget(null);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const toggleExpand = async (rfq) => {
    if (expanded?.id === rfq.id) { setExpanded(null); return; }
    try {
      const detail = await api.getRFQ(rfq.id);
      setExpanded(detail);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const cancelCreate = () => { setShowCreate(false); setForm(EMPTY_FORM); };

  const selectedVendors = vendors.filter(v => form.vendor_ids.includes(v.id));
  const unselectedVendors = vendors.filter(v => !form.vendor_ids.includes(v.id));

  const selectCls = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500";
  const inlineCls = "w-full px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500";

  if (showCreate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={cancelCreate} className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create RFQ</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">New request for quotation</p>
          </div>
        </div>

        <StepIndicator step={1} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 space-y-4 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">RFQ Details</h3>
              <Input label="RFQ Title *" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Office Furniture Procurement Q2" />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={selectCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Deadline *" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
              <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the requirements in detail…" rows={4} />
            </div>

            <div className="flex flex-col gap-2">
              <Btn variant="primary" onClick={() => handleCreate(false)} disabled={saving} className="w-full justify-center">
                {saving ? 'Sending…' : 'Save & Send to Vendors'}
              </Btn>
              <Btn variant="secondary" onClick={() => handleCreate(true)} disabled={saving} className="w-full justify-center">
                {saving ? 'Saving…' : 'Save as Draft'}
              </Btn>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Line Items</h3>
                <Btn variant="ghost" size="sm" onClick={addItem}><Plus size={13} /> Add Item</Btn>
              </div>
              {form.items.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  No items added yet
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700/50">
                        <th className="text-left px-3 py-2 text-gray-500 dark:text-slate-500">Item</th>
                        <th className="text-left px-3 py-2 text-gray-500 dark:text-slate-500 w-16">Qty</th>
                        <th className="text-left px-3 py-2 text-gray-500 dark:text-slate-500 w-16">Unit</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((it, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-slate-700/20 last:border-0">
                          <td className="px-2 py-1.5">
                            <input value={it.product_name} onChange={e => setItem(i, 'product_name', e.target.value)}
                              placeholder="Product name" className={inlineCls} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                              placeholder="0" className={inlineCls} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={it.unit} onChange={e => setItem(i, 'unit', e.target.value)}
                              placeholder="NOS" className={inlineCls} />
                          </td>
                          <td className="px-2 py-1.5">
                            <button onClick={() => removeItem(i)} className="text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                              <X size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {vendors.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Assign Vendors</h3>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                  {selectedVendors.map(v => (
                    <span key={v.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-indigo-500/15 border border-blue-200 dark:border-indigo-500/30 text-blue-700 dark:text-indigo-300 rounded-lg text-xs">
                      {v.name}
                      <button onClick={() => toggleVendor(v.id)} className="text-blue-400 dark:text-indigo-400 hover:text-blue-600 dark:hover:text-indigo-200">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  {selectedVendors.length === 0 && (
                    <span className="text-xs text-gray-400 dark:text-slate-500">No vendors selected</span>
                  )}
                </div>
                {unselectedVendors.length > 0 && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) toggleVendor(Number(e.target.value)); }}
                    className={selectCls}
                  >
                    <option value="">+ Add vendor…</option>
                    {unselectedVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Attachments</h3>
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-6 text-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Drag & drop files or click to upload</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="RFQs" subtitle="Request for Quotations">
        {canCreate && (
          <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Create RFQ</Btn>
        )}
      </SectionHeader>

      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'draft', 'closed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 dark:bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : rfqs.length === 0 ? (
        <Empty icon={FileText} message="No RFQs found"
          action={canCreate && <Btn variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={13} /> Create RFQ</Btn>}
        />
      ) : (
        <div className="space-y-2">
          {rfqs.map(rfq => (
            <div key={rfq.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
              <div
                className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors"
                onClick={() => toggleExpand(rfq)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-blue-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rfq.title}</p>
                      {rfq.category && (
                        <span className="text-xs text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{rfq.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(rfq.deadline)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={rfq.status} />
                  {expanded?.id === rfq.id ? <ChevronUp size={16} className="text-gray-400 dark:text-slate-400" /> : <ChevronDown size={16} className="text-gray-400 dark:text-slate-400" />}
                </div>
              </div>

              {expanded?.id === rfq.id && (
                <div className="border-t border-gray-100 dark:border-slate-700/50 px-5 py-4 space-y-4">
                  {expanded.description && (
                    <p className="text-sm text-gray-700 dark:text-slate-300">{expanded.description}</p>
                  )}
                  {expanded.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Items</p>
                      <div className="bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-500">
                              <th className="text-left px-3 py-2">Product</th>
                              <th className="text-right px-3 py-2">Qty</th>
                              <th className="text-left px-3 py-2">Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expanded.items.map(it => (
                              <tr key={it.id} className="border-b border-gray-100 dark:border-slate-700/30 last:border-0">
                                <td className="px-3 py-2 text-gray-900 dark:text-white">{it.product_name}</td>
                                <td className="px-3 py-2 text-right text-gray-600 dark:text-slate-300">{it.quantity}</td>
                                <td className="px-3 py-2 text-gray-500 dark:text-slate-400">{it.unit || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {expanded.vendors?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Assigned Vendors</p>
                      <div className="flex flex-wrap gap-2">
                        {expanded.vendors.map(v => (
                          <span key={v.id} className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-md text-xs">{v.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {canCreate && (
                    <div className="flex items-center gap-2 pt-1">
                      {rfq.status === 'open' && (
                        <Btn variant="secondary" size="sm" onClick={() => handleStatusChange(rfq, 'closed')}>Close RFQ</Btn>
                      )}
                      {rfq.status === 'draft' && (
                        <Btn variant="primary" size="sm" onClick={() => handleStatusChange(rfq, 'open')}>Publish</Btn>
                      )}
                      <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(rfq)}>
                        <Trash2 size={13} /> Delete
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <Modal
          title="Delete RFQ"
          onClose={() => setDeleteTarget(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete}>Delete</Btn>
          </>}
        >
          <p className="text-gray-700 dark:text-slate-300 text-sm">Delete <span className="font-semibold text-gray-900 dark:text-white">{deleteTarget.title}</span>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
