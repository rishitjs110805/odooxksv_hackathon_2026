import { useEffect, useState } from 'react';
import { Search, Plus, Phone, X, FileUp, MessageSquare, TrendingUp, Clock, Award, Download, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Btn, Input, Textarea, Modal, VendorAvatar, Empty } from '../components/ui';

const EMPTY_FORM = {
  name: '', email: '', phone: '', gst_number: '', category: '',
  status: 'active', address: '', city: '', state: '', pincode: '', photo_url: '',
  payment_terms: '', contract_file: '', delivery_rating: 0, quality_rating: 0,
  internal_notes: '', documents: [], contact_history: [],
};

const CATEGORIES = ['Electronics', 'Furniture', 'Hardware', 'Stationery', 'IT Services', 'Logistics', 'Consumables', 'Constructions', 'Other'];

const TABS = [
  { key: 'all',      label: 'All',     dbStatus: null },
  { key: 'active',   label: 'Active',  dbStatus: 'active' },
  { key: 'pending',  label: 'Pending', dbStatus: 'inactive' },
  { key: 'blocked',  label: 'Blocked', dbStatus: 'blacklisted' },
];

const STATUS_CFG = {
  active:      { label: 'Active',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  inactive:    { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  blacklisted: { label: 'Blocked', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
};

function VendorStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/25' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function MetricsBadge({ label, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${colors[color]}`}>
      {Icon && <Icon size={12} />}
      <span>{label}: {value || '—'}</span>
    </div>
  );
}

export default function Vendors({ user, addToast }) {
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [modal, setModal] = useState(null);
  const [modalTab, setModalTab] = useState('details');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', url: '' });
  const [newContact, setNewContact] = useState({ type: '', details: '', date: new Date().toISOString() });

  const canEdit = ['admin', 'procurement_officer'].includes(user?.role);
  const canDelete = user?.role === 'admin';
  const isCreate = modal === 'create';

  const load = () => {
    setLoading(true);
    api.getVendors({})
      .then(setAllVendors)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const tab = TABS.find(t => t.key === activeTab);

  const displayed = allVendors.filter(v => {
    const matchStatus = tab.dbStatus === null || v.status === tab.dbStatus;
    if (!matchStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.gst_number || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.phone || '').includes(q)
    );
  });

  const counts = {
    all:     allVendors.length,
    active:  allVendors.filter(v => v.status === 'active').length,
    pending: allVendors.filter(v => v.status === 'inactive').length,
    blocked: allVendors.filter(v => v.status === 'blacklisted').length,
  };

  const openView = (v) => {
    setSelected(v);
    setForm({ ...EMPTY_FORM, ...v, photo_url: v.photo_url || '', documents: v.documents || [], contact_history: v.contact_history || [] });
    setModalTab('details');
    setModal('view');
  };
  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModalTab('details'); setModal('create'); };
  const openDelete = () => setModal('delete');
  const close = () => { setModal(null); setSelected(null); setModalTab('details'); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email) { addToast('Validation', 'Name and email are required', 'error'); return; }
    setSaving(true);
    try {
      if (isCreate) {
        await api.createVendor(form);
        addToast('Vendor added', form.name + ' onboarded', 'success');
      } else {
        await api.updateVendor(selected.id, form);
        addToast('Updated', form.name, 'success');
      }
      close();
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.deleteVendor(selected.id);
      addToast('Deleted', selected.name, 'success');
      setModal(null);
      setSelected(null);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const FormFields = () => (
    <div className="space-y-4">
      {/* Modal Tabs */}
      <div className="flex gap-2 border-b border-slate-700 -mx-6 px-6 pb-0">
        {[
          { key: 'details', label: 'Details', icon: '📋' },
          { key: 'metrics', label: 'Metrics', icon: '📊' },
          { key: 'documents', label: 'Documents', icon: '📎' },
          { key: 'history', label: 'History', icon: '⏱️' },
          { key: 'notes', label: 'Notes', icon: '💬' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setModalTab(t.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              modalTab === t.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[55vh] overflow-y-auto pr-2">
        {/* Details Tab */}
        {modalTab === 'details' && (
          <div className="space-y-4">
            {form.photo_url && (
              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
                <img src={form.photo_url} alt="logo"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                  onError={e => { e.currentTarget.style.display = 'none'; }} />
                <span className="text-xs text-slate-400">Company logo</span>
              </div>
            )}
            <Input label="Logo URL" type="url" value={form.photo_url} onChange={e => set('photo_url', e.target.value)} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Vendor Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Infra Supplies Pvt Ltd" />
              </div>
              <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@company.com" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option value="active">Active</option>
                  <option value="inactive">Pending</option>
                  <option value="blacklisted">Blocked</option>
                </select>
              </div>
              <Input label="GST Number" value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="22AAAAA0000A1Z5" />
              <Input label="Payment Terms" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="Net 30 / 2/10 Net 30" />
              <div className="col-span-2">
                <Textarea label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" rows={2} />
              </div>
              <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
              <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
              <Input label="Pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="400001" />
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {modalTab === 'metrics' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3">Performance Ratings (0-5 stars)</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-2">Delivery Rating: {form.delivery_rating || 0}/5</label>
                  <input type="range" min="0" max="5" step="0.5" value={form.delivery_rating || 0}
                    onChange={e => set('delivery_rating', parseFloat(e.target.value))}
                    className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-2">Quality Rating: {form.quality_rating || 0}/5</label>
                  <input type="range" min="0" max="5" step="0.5" value={form.quality_rating || 0}
                    onChange={e => set('quality_rating', parseFloat(e.target.value))}
                    className="w-full" />
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/50">
              <div className="space-y-2">
                <MetricsBadge label="Delivery" value={`${form.delivery_rating || 0}/5`} icon={TrendingUp} color="green" />
                <MetricsBadge label="Quality" value={`${form.quality_rating || 0}/5`} icon={Award} color="amber" />
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {modalTab === 'documents' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3">Upload Certifications & Documents</p>
              <div className="space-y-2">
                <Input label="Document Name" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} placeholder="e.g., ISO 9001 Certificate" />
                <Input label="Document URL" type="url" value={newDoc.url} onChange={e => setNewDoc({...newDoc, url: e.target.value})} placeholder="https://..." />
                <Btn variant="secondary" size="sm" onClick={() => {
                  if (newDoc.name && newDoc.url) {
                    set('documents', [...(form.documents || []), newDoc]);
                    setNewDoc({ name: '', url: '' });
                    addToast('Added', newDoc.name, 'success');
                  }
                }}><FileUp size={14} /> Add Document</Btn>
              </div>
            </div>
            {form.documents && form.documents.length > 0 && (
              <div className="space-y-2">
                {form.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-700/50">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline truncate">
                      {doc.name}
                    </a>
                    <Btn variant="secondary" size="sm" onClick={() => set('documents', form.documents.filter((_, i) => i !== idx))}><X size={14} /></Btn>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {modalTab === 'history' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3">Add Contact Entry</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Contact Type</label>
                  <select value={newContact.type} onChange={e => setNewContact({...newContact, type: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="">Select type</option>
                    <option value="call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="quotation">Quotation Received</option>
                  </select>
                </div>
                <Textarea label="Details" value={newContact.details} onChange={e => setNewContact({...newContact, details: e.target.value})} placeholder="Notes about the contact..." rows={2} />
                <Btn variant="secondary" size="sm" onClick={() => {
                  if (newContact.type && newContact.details) {
                    set('contact_history', [...(form.contact_history || []), {...newContact, date: new Date().toISOString()}]);
                    setNewContact({ type: '', details: '', date: new Date().toISOString() });
                    addToast('Added', 'Contact entry recorded', 'success');
                  }
                }}><Clock size={14} /> Add Entry</Btn>
              </div>
            </div>
            {form.contact_history && form.contact_history.length > 0 && (
              <div className="space-y-2">
                {form.contact_history.map((entry, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-slate-300 capitalize">{entry.type}</p>
                        <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-400 mt-1">{entry.details}</p>
                      </div>
                      <Btn variant="secondary" size="sm" onClick={() => set('contact_history', form.contact_history.filter((_, i) => i !== idx))}><X size={14} /></Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {modalTab === 'notes' && (
          <div className="space-y-4">
            <Textarea label="Internal Notes" value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} placeholder="Internal notes visible only to your team..." rows={8} />
            <div className="p-3 bg-slate-900/50 rounded border border-slate-700/50 flex items-start gap-2">
              <AlertCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">These notes are for internal use only and won't be visible to vendors.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionHeader title="Vendors" subtitle="Manage supplier profiles and registration">
        {canEdit && <Btn variant="primary" onClick={openCreate}><Plus size={15} /> Add Vendor</Btn>}
      </SectionHeader>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, GST number, category..."
          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : displayed.length === 0 ? (
        <Empty icon={Search} message="No vendors found"
          action={canEdit && <Btn variant="primary" size="sm" onClick={openCreate}><Plus size={13} /> Add Vendor</Btn>}
        />
      ) : (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Vendor Name</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Category</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">GST No.</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Contact No.</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Rating</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {displayed.map(v => (
                  <tr key={v.id} className="hover:bg-slate-700/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <VendorAvatar vendor={v} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-white">{v.name}</p>
                          <p className="text-xs text-slate-500">{v.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{v.category || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{v.gst_number || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{v.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 text-xs">
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">D:{v.delivery_rating || 0}</span>
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">Q:{v.quality_rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><VendorStatusBadge status={v.status} /></td>
                    <td className="px-4 py-3">
                      <Btn variant="secondary" size="sm" onClick={() => openView(v)}>View</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View / Edit Modal */}
      {modal === 'view' && selected && (
        <Modal
          title={selected.name}
          onClose={close}
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {canDelete && (
                  <Btn variant="danger" size="sm" onClick={openDelete}>Delete Vendor</Btn>
                )}
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary" onClick={close}>Close</Btn>
                {canEdit && (
                  <Btn variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Btn>
                )}
              </div>
            </div>
          }
        >
          {canEdit ? <FormFields /> : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                <VendorAvatar vendor={selected} size="lg" />
                <div>
                  <p className="font-semibold text-white">{selected.name}</p>
                  <p className="text-xs text-slate-400">{selected.email}</p>
                  <VendorStatusBadge status={selected.status} />
                </div>
              </div>
              
              {/* Metrics */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase">Performance</p>
                <MetricsBadge label="Delivery" value={`${selected.delivery_rating || 0}/5`} icon={TrendingUp} color="green" />
                <MetricsBadge label="Quality" value={`${selected.quality_rating || 0}/5`} icon={Award} color="amber" />
              </div>

              {/* Details */}
              {[
                ['Category', selected.category],
                ['Phone', selected.phone],
                ['GST Number', selected.gst_number],
                ['Payment Terms', selected.payment_terms],
                ['Address', [selected.address, selected.city, selected.state, selected.pincode].filter(Boolean).join(', ')],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <span className="text-slate-500 w-28 shrink-0">{label}</span>
                  <span className="text-slate-200">{val}</span>
                </div>
              ) : null)}

              {/* Documents */}
              {selected.documents && selected.documents.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-medium text-slate-400 uppercase">Documents</p>
                  {selected.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:underline">
                      <Download size={12} /> {doc.name}
                    </a>
                  ))}
                </div>
              )}

              {/* Notes */}
              {selected.internal_notes && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-medium text-slate-400 uppercase mb-2">Internal Notes</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{selected.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal
          title="Add Vendor"
          onClose={close}
          footer={<>
            <Btn variant="secondary" onClick={close}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add Vendor'}</Btn>
          </>}
        >
          <FormFields />
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && selected && (
        <Modal
          title="Delete Vendor"
          onClose={() => setModal('view')}
          footer={<>
            <Btn variant="secondary" onClick={() => setModal('view')}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Btn>
          </>}
        >
          <p className="text-slate-300 text-sm">
            Delete <span className="font-semibold text-white">{selected.name}</span>? This cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
