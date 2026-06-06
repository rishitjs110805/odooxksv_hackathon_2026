import { useState } from 'react';
import { LogIn, UserPlus, Eye, EyeOff, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { api, setToken } from '../services/api';
import { Btn, Input } from '../components/ui';

const ROLES = [
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'manager', label: 'Manager / Approver' },
  { value: 'admin', label: 'Administrator' },
  { value: 'vendor', label: 'Vendor' },
];

function Logo() {
  return (
    <div className="text-center mb-8">
      <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-blue-500/20 dark:shadow-indigo-500/20">V</div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">VendorBridge</h1>
      <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Procurement &amp; Vendor Management</p>
    </div>
  );
}

function ForgotPasswordForm({ onBack, addToast }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async () => {
    if (!email) { addToast('Validation', 'Enter your email address', 'error'); return; }
    setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      setSent(true);
      if (result.reset_link) setResetLink(result.reset_link);
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Logo />
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
          <ArrowLeft size={13} /> Back to Sign In
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Mail size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            {resetLink ? (
              <>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Reset Link Ready</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                  Email delivery is not configured. Click the button below to reset your password.
                </p>
                <a
                  href={resetLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <KeyRound size={15} /> Reset Password Now
                </a>
              </>
            ) : (
              <>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Check your email</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm">
                  If <span className="text-gray-900 dark:text-white font-medium">{email}</span> is registered, a reset link has been sent.
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">The link expires in 1 hour.</p>
              </>
            )}
            <Btn variant="ghost" size="sm" className="mt-4" onClick={onBack}>Back to Sign In</Btn>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h3 className="text-gray-900 dark:text-white font-semibold">Forgot Password?</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Enter your email and we'll send a reset link.</p>
            </div>
            <div className="space-y-4">
              <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="you@company.com" autoFocus />
              <Btn variant="primary" className="w-full justify-center py-2.5" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : <><Mail size={15} /> Send Reset Link</>}
              </Btn>
            </div>
          </>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">VendorBridge © 2026 · Procurement ERP Platform</p>
    </div>
  );
}

function ResetPasswordForm({ token, onSuccess, addToast }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, form.password);
      addToast('Password Reset', 'Your password has been updated. Please sign in.', 'success');
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Logo />
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-indigo-500/10 border border-blue-100 dark:border-indigo-500/20 flex items-center justify-center">
            <KeyRound size={16} className="text-blue-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold">Set New Password</h3>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">Choose a strong password</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 transition-colors"
              />
              <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <Input label="Confirm New Password" type="password" value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Repeat new password" onKeyDown={e => e.key === 'Enter' && handleSubmit()} error={error} />
          <Btn variant="primary" className="w-full justify-center py-2.5" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating…
              </span>
            ) : <><KeyRound size={15} /> Set New Password</>}
          </Btn>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">VendorBridge © 2026 · Procurement ERP Platform</p>
    </div>
  );
}

export default function LoginPage({ onLogin, addToast, resetToken }) {
  const [mode, setMode] = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'procurement_officer' });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (resetToken) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <ResetPasswordForm token={resetToken} onSuccess={() => window.location.replace(window.location.pathname)} addToast={addToast} />
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <ForgotPasswordForm onBack={() => setMode('login')} addToast={addToast} />
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    if (mode === 'signup' && !form.name.trim()) e.name = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(form.email, form.password);
      } else {
        data = await api.signup({ email: form.email, password: form.password, name: form.name, role: form.role });
      }
      setToken(data.access_token);
      const me = await api.me();
      onLogin(me);
      addToast('Welcome', `Signed in as ${me.name}`, 'success');
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 mb-6">
            {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Create Account' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setMode(t.id); setErrors({}); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === t.id
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-4" onKeyDown={e => e.key === 'Enter' && handleSubmit()}>
            {mode === 'signup' && (
              <Input label="Full Name" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Manav Panchal" error={errors.name} />
            )}

            <Input label="Email Address" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="you@company.com" error={errors.email} />

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 pr-10 bg-white dark:bg-slate-900 border ${errors.password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-indigo-500/30 transition-colors`}
                />
                <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.password}</p>}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button onClick={() => setMode('forgot')} className="text-xs text-blue-600 dark:text-indigo-400 hover:text-blue-800 dark:hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Btn variant="primary" className="w-full justify-center py-2.5" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </Btn>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">VendorBridge © 2026 · Procurement ERP Platform</p>
      </div>
    </div>
  );
}
