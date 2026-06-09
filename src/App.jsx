// ============================================================
//  App.jsx — LIGTAS LILIW · Full Router
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoginPage        from './LoginPage';
import RegisterPage     from './RegisterPage';
import AdminDashboard   from './AdminDashboard';
import MemberDashboard  from './MemberDashboard';
import IncidentReporter from './IncidentReporter';

// ── Route guard ───────────────────────────────────────────────
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function Loader() {
  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#eff6ff', fontFamily: 'DM Sans, sans-serif',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #dbeafe',
        borderTopColor: '#1a56db',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: '#8fa8c0' }}>Loading LIGTAS LILIW…</p>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
        }/>

        {/* Member — dashboard is the home, /report is the form */}
        <Route path="/dashboard" element={
          <RequireAuth role="member"><MemberDashboard /></RequireAuth>
        }/>
        <Route path="/report" element={
          <RequireAuth role="member"><IncidentReporter /></RequireAuth>
        }/>

        {/* Catch-all */}
        <Route path="*" element={
          !user
            ? <Navigate to="/login"     replace />
            : user.role === 'admin'
              ? <Navigate to="/admin"     replace />
              : <Navigate to="/dashboard" replace />
        }/>
      </Routes>
    </BrowserRouter>
  );
}
