import { useEffect, useState } from 'react';
import { Search, Plus, Phone, X } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, Btn, Input, Textarea, Modal, VendorAvatar, Empty } from '../components/ui';

const EMPTY_FORM = {
  name: '', email: '', phone: '', gst_number: '', category: '',
  status: 'active', address: '', city: '', state: '', pincode: '', photo_url: '',
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

export default function Vendors({ user, addToast }) {
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
    setForm({ ...EMPTY_FORM, ...v, photo_url: v.photo_url || '' });
    setModal('view');
  };
  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal('create'); };
  const openDelete = () => setModal('delete');
  const close = () => { setModal(null); setSelected(null); };

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
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
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
        <div className="col-span-2">
          <Textarea label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" rows={2} />
        </div>
        <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
        <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
        <Input label="Pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="400001" />
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
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                <VendorAvatar vendor={selected} size="lg" />
                <div>
                  <p className="font-semibold text-white">{selected.name}</p>
                  <p className="text-xs text-slate-400">{selected.email}</p>
                  <VendorStatusBadge status={selected.status} />
                </div>
              </div>
              {[
                ['Category', selected.category],
                ['Phone', selected.phone],
                ['GST Number', selected.gst_number],
                ['Address', [selected.address, selected.city, selected.state, selected.pincode].filter(Boolean).join(', ')],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <span className="text-slate-500 w-28 shrink-0">{label}</span>
                  <span className="text-slate-200">{val}</span>
                </div>
              ) : null)}
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
