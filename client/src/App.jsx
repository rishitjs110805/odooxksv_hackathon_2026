import { useState, useCallback, useEffect } from 'react';
import { api, setToken, clearToken, getToken } from './services/api';
import { Toast, Spinner } from './components/ui';
import { Sidebar } from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RFQs from './pages/RFQs';
import Quotations from './pages/Quotations';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

const resetToken = new URLSearchParams(window.location.search).get('reset_token');

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Restore session from stored token (skip if handling a password reset link)
  useEffect(() => {
    if (resetToken) { setAuthChecked(true); return; }
    if (!getToken()) { setAuthChecked(true); return; }
    api.me()
      .then(me => { setUser(me); })
      .catch(() => { clearToken(); })
      .finally(() => setAuthChecked(true));
  }, []);

  const refreshPendingCount = useCallback((currentUser) => {
    if (!currentUser) return;
    api.getNotifications()
      .then(list => setPendingCount(list.filter(n => n.priority === 'high').length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) refreshPendingCount(user);
  }, [user?.role]);

  const handleLogin = (me) => {
    setUser(me);
    setActiveView('dashboard');
    refreshPendingCount(me);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setActiveView('dashboard');
    addToast('Signed out', 'See you next time', 'info');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toast toasts={toasts} removeToast={removeToast} />
        <LoginPage onLogin={handleLogin} addToast={addToast} resetToken={resetToken} />
      </>
    );
  }

  const renderPage = () => {
    const props = { user, addToast, setActiveView };
    switch (activeView) {
      case 'dashboard':       return <Dashboard {...props} />;
      case 'vendors':         return <Vendors {...props} />;
      case 'rfqs':            return <RFQs {...props} />;
      case 'quotations':      return <Quotations {...props} />;
      case 'approvals':       return <Approvals {...props} onAction={() => refreshPendingCount(user)} />;
      case 'purchase-orders': return <PurchaseOrders {...props} />;
      case 'invoices':        return <Invoices {...props} />;
      case 'activity':        return <ActivityLogs {...props} />;
      case 'reports':         return <Reports {...props} />;
      case 'users':           return <Users {...props} />;
      case 'profile':         return <Profile user={user} setUser={setUser} addToast={addToast} />;
      case 'notifications':   return <Notifications {...props} />;
      default:                return <Dashboard {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Toast toasts={toasts} removeToast={removeToast} />
      <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onLogout={handleLogout} pendingCount={pendingCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
