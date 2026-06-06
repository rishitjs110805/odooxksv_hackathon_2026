import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, ChevronDown, ChevronUp, X, Calendar, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Input, Textarea, Modal, Empty, fmtDate } from '../components/ui';

const EMPTY_FORM = { title: '', description: '', deadline: '', vendor_ids: [], items: [] };
const EMPTY_ITEM = { product_name: '', quantity: '', unit: '', specifications: '' };

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
    ...f,
    items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it),
  }));
  const toggleVendor = (id) => {
    setForm(f => ({
      ...f,
      vendor_ids: f.vendor_ids.includes(id)
        ? f.vendor_ids.filter(v => v !== id)
        : [...f.vendor_ids, id],
    }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.deadline) { addToast('Validation', 'Title and deadline required', 'error'); return; }
    setSaving(true);
    try {
      await api.createRFQ({
        title: form.title,
        description: form.description,
        deadline: form.deadline,
        vendor_ids: form.vendor_ids,
        items: form.items.filter(it => it.product_name).map(it => ({
          ...it, quantity: Number(it.quantity) || 1,
        })),
      });
      addToast('RFQ Created', form.title + ' published to vendors', 'success');
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
      addToast('Updated', `RFQ status → ${status}`, 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteRFQ(deleteTarget.id);
      addToast('Deleted', deleteTarget.title + ' removed', 'success');
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

  return (
    <div className="space-y-5">
      <SectionHeader title="RFQs" subtitle="Request for Quotations">
        {canCreate && (
          <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Create RFQ</Btn>
        )}
      </SectionHeader>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'open', 'draft', 'closed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
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
            <div key={rfq.id} className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={() => toggleExpand(rfq)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{rfq.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(rfq.deadline)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={rfq.status} />
                  {expanded?.id === rfq.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {expanded?.id === rfq.id && (
                <div className="border-t border-slate-700/50 px-5 py-4 space-y-4">
                  {expanded.description && (
                    <p className="text-sm text-slate-300">{expanded.description}</p>
                  )}

                  {/* Items */}
                  {expanded.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Items</p>
                      <div className="bg-slate-900 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-500">
                              <th className="text-left px-3 py-2">Product</th>
                              <th className="text-right px-3 py-2">Qty</th>
                              <th className="text-left px-3 py-2">Unit</th>
                              <th className="text-left px-3 py-2">Specs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expanded.items.map(it => (
                              <tr key={it.id} className="border-b border-slate-700/30 last:border-0">
                                <td className="px-3 py-2 text-white">{it.product_name}</td>
                                <td className="px-3 py-2 text-right text-slate-300">{it.quantity}</td>
                                <td className="px-3 py-2 text-slate-400">{it.unit || '—'}</td>
                                <td className="px-3 py-2 text-slate-400">{it.specifications || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Vendors */}
                  {expanded.vendors?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Assigned Vendors</p>
                      <div className="flex flex-wrap gap-2">
                        {expanded.vendors.map(v => (
                          <span key={v.id} className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-md text-xs">{v.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
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

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="Create RFQ"
          onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
          footer={<>
            <Btn variant="secondary" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create RFQ'}</Btn>
          </>}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Office Furniture Procurement Q3" />
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed requirements…" rows={3} />
            <Input label="Deadline *" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400">Line Items</label>
                <Btn variant="ghost" size="sm" onClick={addItem}><Plus size={13} /> Add Item</Btn>
              </div>
              {form.items.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-3 bg-slate-900 rounded-lg">No items added</p>
              )}
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                  <input value={it.product_name} onChange={e => setItem(i, 'product_name', e.target.value)} placeholder="Product"
                    className="col-span-2 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  <input type="number" value={it.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} placeholder="Qty"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  <input value={it.unit} onChange={e => setItem(i, 'unit', e.target.value)} placeholder="Unit"
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                  <button onClick={() => removeItem(i)} className="flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Vendor assignment */}
            {vendors.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  <Users size={12} className="inline mr-1" />Assign Vendors
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {vendors.map(v => (
                    <button
                      key={v.id}
                      onClick={() => toggleVendor(v.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        form.vendor_ids.includes(v.id)
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${form.vendor_ids.includes(v.id) ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal
          title="Delete RFQ"
          onClose={() => setDeleteTarget(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete}>Delete</Btn>
          </>}
        >
          <p className="text-slate-300 text-sm">Delete <span className="font-semibold text-white">{deleteTarget.title}</span>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
