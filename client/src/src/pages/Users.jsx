import { useEffect, useState } from 'react';
import { Search, Users as UsersIcon, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Modal, Empty, fmtDate } from '../components/ui';

const ROLE_STYLES = {
  admin: 'bg-red-500/10 text-red-400 border-red-500/25',
  procurement_officer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  manager: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  vendor: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
};

const ROLE_LABELS = {
  admin: 'Admin',
  procurement_officer: 'Procurement Officer',
  manager: 'Manager',
  vendor: 'Vendor',
};

export default function Users({ user: currentUser, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getUsers()
      .then(setUsers)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const handleToggle = async (u) => {
    try {
      await api.toggleUserActive(u.id);
      addToast('Updated', `${u.name} ${u.is_active ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.deleteUser(deleteTarget.id);
      addToast('Deleted', deleteTarget.name + ' removed', 'success');
      setDeleteTarget(null);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Users" subtitle="System user management">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
          />
        </div>
        {search && <Btn variant="ghost" size="sm" onClick={() => setSearch('')}><X size={13} /></Btn>}
      </SectionHeader>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <Empty icon={UsersIcon} message="No users found" />
      ) : (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0">
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${ROLE_STYLES[u.role] || ''}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {currentUser?.sub !== String(u.id) && (
                          <>
                            <Btn variant="ghost" size="sm" onClick={() => handleToggle(u)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                              {u.is_active ? <ToggleRight size={15} className="text-emerald-400" /> : <ToggleLeft size={15} className="text-slate-500" />}
                            </Btn>
                            <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(u)}>
                              <Trash2 size={13} />
                            </Btn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <Modal
          title="Delete User"
          onClose={() => setDeleteTarget(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Btn>
          </>}
        >
          <p className="text-slate-300 text-sm">
            Delete <span className="font-semibold text-white">{deleteTarget.name}</span>? All their data will be unlinked.
          </p>
        </Modal>
      )}
    </div>
  );
}
