import { useState } from 'react';
import { Mail, Shield, Calendar, Lock, Edit2, Check, X, User } from 'lucide-react';
import { api } from '../services/api';
import { SectionHeader, Btn, Input } from '../components/ui';

const ROLE_LABELS = {
  admin: 'Administrator',
  procurement_officer: 'Procurement Officer',
  manager: 'Manager / Approver',
  vendor: 'Vendor',
};

const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-500/10 border-red-500/25',
  procurement_officer: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
  manager: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  vendor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
};

export default function Profile({ user, setUser, addToast }) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSavingName(true);
    try {
      await api.updateProfile({ name: nameVal.trim() });
      setUser(u => ({ ...u, name: nameVal.trim() }));
      addToast('Updated', 'Display name updated', 'success');
      setEditingName(false);
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSavingName(false);
    }
  };

  const cancelEdit = () => { setEditingName(false); setNameVal(user?.name || ''); };

  const savePassword = async () => {
    setPwError('');
    if (!pwForm.current) { setPwError('Enter your current password'); return; }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.updateProfile({ current_password: pwForm.current, new_password: pwForm.next });
      addToast('Password Changed', 'Your password has been updated', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      setPwError(e.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Profile & Settings" subtitle="Manage your account information" />

      {/* Identity card */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-400 shrink-0 select-none">
            {initials}
          </div>

          <div className="flex-1 min-w-0 space-y-5">
            {/* Name */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <User size={11} /> Full Name
              </p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus
                    className="px-3 py-1.5 bg-slate-900 border border-indigo-500 rounded-lg text-sm text-white focus:outline-none w-56 focus:ring-1 focus:ring-indigo-500/30"
                  />
                  <Btn variant="success" size="sm" onClick={saveName} disabled={savingName}>
                    <Check size={13} />
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={cancelEdit}>
                    <X size={13} />
                  </Btn>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{user?.name}</span>
                  <button
                    onClick={() => { setNameVal(user?.name || ''); setEditingName(true); }}
                    className="text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Edit name"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Mail size={11} /> Email Address
              </p>
              <p className="text-slate-300 text-sm">{user?.email}</p>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Shield size={11} /> Role
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${ROLE_COLORS[user?.role] || 'text-slate-400 bg-slate-500/10 border-slate-500/25'}`}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>

            {/* Member since */}
            {user?.created_at && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar size={11} /> Member Since
                </p>
                <p className="text-slate-300 text-sm">
                  {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lock size={15} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Change Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update your login credentials</p>
          </div>
        </div>

        <div className="space-y-4 max-w-sm">
          <Input
            label="Current Password"
            type="password"
            value={pwForm.current}
            onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
            placeholder="Your current password"
          />
          <Input
            label="New Password"
            type="password"
            value={pwForm.next}
            onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Repeat new password"
            error={pwError}
          />
          <Btn variant="primary" onClick={savePassword} disabled={savingPw}>
            {savingPw ? 'Updating…' : 'Update Password'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
