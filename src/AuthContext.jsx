// ============================================================
//  AuthContext.jsx
//  Global authentication state for LERS.
//
//  Wraps the entire app. Any component can call useAuth()
//  to get the current user, their role, and auth actions.
//
//  Session is persisted in localStorage so the user stays
//  logged in after a page refresh.
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from './authQueries';

// ------------------------------------------------------------
//  Context setup
// ------------------------------------------------------------

const AuthContext = createContext(null);

const SESSION_KEY = 'lers_session';

// ------------------------------------------------------------
//  AuthProvider
//  Wrap your entire app with this in main.jsx:
//
//    <AuthProvider>
//      <App />
//    </AuthProvider>
// ------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, name, email, role }
  const [loading, setLoading] = useState(true);   // true while restoring session

  // ----------------------------------------------------------
  //  Restore session from localStorage on first mount
  // ----------------------------------------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Basic sanity check — must have id and role
        if (parsed?.id && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch (_) {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  // ----------------------------------------------------------
  //  login
  //  Called from LoginPage with { email, password }.
  //  Throws error codes: USER_NOT_FOUND | WRONG_PASSWORD | DB_ERROR
  // ----------------------------------------------------------
  const login = async ({ email, password }) => {
    try {
      const loggedInUser = await loginUser({ email, password });
      setUser(loggedInUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
      return loggedInUser;
    } catch (err) {
      // Re-throw so LoginPage can show the right message
      throw err;
    }
  };

  // ----------------------------------------------------------
  //  register
  //  Called from RegisterPage with { name, email, password }.
  //  Throws error code: EMAIL_TAKEN | DB_ERROR
  //  Automatically logs in after successful registration.
  // ----------------------------------------------------------
  const register = async ({ name, email, password }) => {
    try {
      const newUser = await registerUser({ name, email, password });
      setUser(newUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      throw err;
    }
  };

  // ----------------------------------------------------------
  //  logout
  //  Clears state and localStorage, redirects handled by caller.
  // ----------------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // ----------------------------------------------------------
  //  Helpers — use these in components for clean checks
  // ----------------------------------------------------------
  const isAdmin  = user?.role === 'admin';
  const isMember = user?.role === 'member';
  const isLoggedIn = !!user;

  const value = {
    user,          // full user object or null
    loading,       // true while restoring session (show spinner)
    isLoggedIn,
    isAdmin,
    isMember,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ------------------------------------------------------------
//  useAuth
//  The hook every component uses to access auth state.
//
//  Usage:
//    const { user, isAdmin, login, logout } = useAuth();
// ------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
