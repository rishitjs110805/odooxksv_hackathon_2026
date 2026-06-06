import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Building2, Phone, Mail, MapPin, X } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Input, Select, Textarea, Modal, VendorAvatar, Empty } from '../components/ui';

const EMPTY_FORM = {
  name: '', email: '', phone: '', gst_number: '', category: '',
  status: 'active', address: '', city: '', state: '', pincode: '', photo_url: '',
};

const CATEGORIES = ['Electronics', 'Furniture', 'Hardware', 'Stationery', 'IT Services', 'Logistics', 'Consumables', 'Other'];

export default function Vendors({ user, addToast }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit = ['admin', 'procurement_officer'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    api.getVendors({ search, category: filterCat, status: filterStatus })
      .then(setVendors)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, filterCat, filterStatus]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (v) => { setForm({ ...EMPTY_FORM, ...v, photo_url: v.photo_url || '' }); setSelected(v); setModal('edit'); };
  const openDelete = (v) => { setSelected(v); setModal('delete'); };
  const close = () => { setModal(null); setSelected(null); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email) { addToast('Validation', 'Name and email are required', 'error'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.createVendor(form);
        addToast('Vendor added', form.name + ' has been onboarded', 'success');
      } else {
        await api.updateVendor(selected.id, form);
        addToast('Vendor updated', form.name + ' has been updated', 'success');
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
      addToast('Vendor removed', selected.name + ' has been deleted', 'success');
      close();
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Vendors" subtitle="Manage your vendor network">
        {canEdit && <Btn variant="primary" onClick={openCreate}><Plus size={15} /> Add Vendor</Btn>}
      </SectionHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        {(search || filterCat || filterStatus) && (
          <Btn variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterCat(''); setFilterStatus(''); }}>
            <X size={13} /> Clear
          </Btn>
        )}
      </div>

      {loading ? <PageLoader /> : vendors.length === 0 ? (
        <Empty icon={Building2} message="No vendors found"
          action={canEdit && <Btn variant="primary" size="sm" onClick={openCreate}><Plus size={13} /> Add Vendor</Btn>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-slate-800 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <VendorAvatar vendor={v} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                  {v.category && <p className="text-xs text-slate-500 mt-0.5">{v.category}</p>}
                </div>
                <StatusBadge status={v.status} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                {v.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="shrink-0 text-slate-500" />
                    <span className="truncate">{v.email}</span>
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="shrink-0 text-slate-500" />
                    <span>{v.phone}</span>
                  </div>
                )}
                {(v.city || v.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="shrink-0 text-slate-500" />
                    <span>{[v.city, v.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {v.gst_number && (
                  <p className="text-slate-500 font-mono text-xs">{v.gst_number}</p>
                )}
              </div>

              {(canEdit || canDelete) && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                  {canEdit && (
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(v)}>
                      <Edit size={13} /> Edit
                    </Btn>
                  )}
                  {canDelete && (
                    <Btn variant="danger" size="sm" onClick={() => openDelete(v)}>
                      <Trash2 size={13} /> Delete
                    </Btn>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add Vendor' : 'Edit Vendor'}
          onClose={close}
          footer={<>
            <Btn variant="secondary" onClick={close}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Vendor'}</Btn>
          </>}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Photo */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Company Logo / Photo URL</label>
              <input
                type="url"
                value={form.photo_url}
                onChange={e => set('photo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {form.photo_url && (
                <img src={form.photo_url} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-slate-700 mt-2"
                  onError={e => e.currentTarget.style.display = 'none'} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Vendor Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Infra Supplies Pvt Ltd" />
              </div>
              <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@company.com" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
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
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
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
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <Modal
          title="Delete Vendor"
          onClose={close}
          footer={<>
            <Btn variant="secondary" onClick={close}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Btn>
          </>}
        >
          <p className="text-slate-300 text-sm">
            Delete <span className="font-semibold text-white">{selected?.name}</span>? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
