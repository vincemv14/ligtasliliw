// ============================================================
//  LoginPage.jsx — LIGTAS LILIW · Full Responsive
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  if (isLoggedIn) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    return null;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Punan ang lahat ng fields.'); return; }
    setLoading(true);
    try {
      const u = await login({ email: form.email, password: form.password });
      navigate(u.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      if (err.message === 'USER_NOT_FOUND')    setError('Walang account na may email na iyan.');
      else if (err.message === 'WRONG_PASSWORD') setError('Mali ang password. Subukan ulit.');
      else setError('Hindi makakonekta. Subukan ulit.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="lp-root">

        {/* ── Left panel (desktop only) ── */}
        <div className="lp-left">
          <div className="lp-left-content">
            <div className="lp-brand-logo">
              <ShieldIcon size={36} />
            </div>
            <h1 className="lp-brand-name">LIGTAS LILIW</h1>
            <p className="lp-brand-full">
              Liliw Integrated Government and Technology&#8209;Assisted Safety System
            </p>
            <div className="lp-divider" />
            <p className="lp-tagline">"Mabilis na Responde,<br />Ligtas na Mamamayan."</p>
            <div className="lp-features">
              {[
                { icon: '🚨', text: 'Real-time emergency reporting' },
                { icon: '📍', text: 'GPS location tracking' },
                { icon: '🔔', text: 'Instant responder notification' },
                { icon: '📊', text: 'Live incident monitoring' },
              ].map(f => (
                <div key={f.text} className="lp-feature-item">
                  <span className="lp-feature-icon">{f.icon}</span>
                  <span className="lp-feature-text">{f.text}</span>
                </div>
              ))}
            </div>
            <p className="lp-left-footer">Liliw, Laguna · Official System</p>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="lp-right">

          {/* Mobile-only logo */}
          <div className="lp-mobile-brand">
            <div className="lp-mobile-logo"><ShieldIcon size={22} /></div>
            <div>
              <p className="lp-mobile-name">LIGTAS LILIW</p>
              <p className="lp-mobile-sub">Liliw Emergency Response System</p>
            </div>
          </div>

          <div className="lp-form-wrap">
            <h2 className="lp-heading">Mag-login</h2>
            <p className="lp-subheading">I-login ang iyong account para magpatuloy.</p>

            {error && <div className="lp-error">⚠ {error}</div>}

            <form onSubmit={handleSubmit} className="lp-form">

              <div className="lp-field">
                <label className="lp-label">Email Address</label>
                <input
                  className="lp-input"
                  type="email" name="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-pw-wrap">
                  <input
                    className="lp-input lp-input-pw"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="lp-submit">
                {loading
                  ? <><span className="lp-spinner" /> Naglo-login…</>
                  : 'Login sa LIGTAS LILIW'
                }
              </button>

            </form>

            <div className="lp-separator"><span>o</span></div>

            <p className="lp-footer">
              Wala pang account?{' '}
              <Link to="/register" className="lp-link">Mag-register dito</Link>
            </p>

            <p className="lp-disclaimer">
              Para lamang sa mga residente ng Liliw, Laguna.<br />
              Ang maling paggamit ay may katumbas na parusa.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────
function ShieldIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>
    </svg>
  );
}

// ── CSS ────────────────────────────────────────────────────────
const css = `
  html, body, #root {
    margin: 0; padding: 0;
    width: 100%; min-height: 100vh;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Root layout: side-by-side on desktop, stacked on mobile ── */
  .lp-root {
    display: flex;
    min-height: 100vh;
    width: 100%;
  }

  /* ── LEFT PANEL ── */
  .lp-left {
    display: none; /* hidden on mobile */
    width: 45%;
    flex-shrink: 0;
    background: linear-gradient(160deg, #0f2d5e 0%, #1a56db 60%, #1d6af5 100%);
    position: relative;
    overflow: hidden;
  }

  /* Decorative circles */
  .lp-left::before {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    top: -100px; right: -100px;
  }
  .lp-left::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.06);
    bottom: -80px; left: -60px;
  }

  .lp-left-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    padding: 48px 40px;
  }

  .lp-brand-logo {
    width: 64px; height: 64px;
    background: rgba(255,255,255,0.15);
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  }

  .lp-brand-name {
    font-size: 28px; font-weight: 800;
    letter-spacing: 4px; color: #fff;
    margin: 0 0 10px;
  }

  .lp-brand-full {
    font-size: 13px; color: rgba(255,255,255,0.75);
    line-height: 1.6; margin: 0 0 24px;
    max-width: 280px;
  }

  .lp-divider {
    width: 40px; height: 2px;
    background: rgba(255,255,255,0.3);
    margin-bottom: 20px;
  }

  .lp-tagline {
    font-size: 18px; font-weight: 600;
    color: #fff; line-height: 1.5;
    margin-bottom: 32px;
    font-style: italic;
  }

  .lp-features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }

  .lp-feature-item {
    display: flex; align-items: center; gap: 12px;
  }

  .lp-feature-icon {
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.12);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }

  .lp-feature-text {
    font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500;
  }

  .lp-left-footer {
    font-size: 11px; color: rgba(255,255,255,0.4);
    letter-spacing: 1px; text-transform: uppercase;
    margin-top: auto;
  }

  /* ── RIGHT PANEL ── */
  .lp-right {
    flex: 1;
    background: #f8faff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    min-height: 100vh;
  }

  /* Mobile-only brand header */
  .lp-mobile-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    width: 100%;
    max-width: 420px;
  }

  .lp-mobile-logo {
    width: 44px; height: 44px;
    background: #1a56db;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .lp-mobile-name {
    font-size: 16px; font-weight: 800;
    letter-spacing: 2px; color: #0f2d5e;
    line-height: 1.1;
  }

  .lp-mobile-sub {
    font-size: 10px; color: #8fa8c0; margin-top: 2px;
  }

  .lp-form-wrap {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 20px;
    padding: 36px 32px;
    box-shadow: 0 4px 32px rgba(15,45,94,0.10);
    border: 1px solid #e2eaf6;
  }

  .lp-heading {
    font-size: 24px; font-weight: 700;
    color: #0f1b2d; margin: 0 0 6px;
  }

  .lp-subheading {
    font-size: 13px; color: #6b7a8d; margin: 0 0 24px;
  }

  .lp-error {
    background: #fff5f5; border: 1px solid #fca5a5;
    border-radius: 10px; padding: 11px 14px;
    font-size: 13px; color: #dc2626; margin-bottom: 18px;
    font-weight: 500;
  }

  .lp-form { display: flex; flex-direction: column; gap: 18px; }

  .lp-field { display: flex; flex-direction: column; gap: 7px; }

  .lp-label {
    font-size: 13px; font-weight: 600; color: #374151;
  }

  .lp-input {
    width: 100%; padding: 13px 16px;
    font-size: 15px; font-family: inherit;
    border: 1.5px solid #e2eaf6; border-radius: 10px;
    outline: none; background: #f8faff; color: #0f1b2d;
    transition: border-color 0.15s, box-shadow 0.15s;
    -webkit-appearance: none;
  }
  .lp-input::placeholder { color: #b0bec9; }
  .lp-input:focus {
    border-color: #1a56db; background: #fff;
    box-shadow: 0 0 0 3px rgba(26,86,219,0.10);
  }
  .lp-input-pw { padding-right: 48px; }

  .lp-pw-wrap { position: relative; }

  .lp-eye {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #8fa8c0; padding: 4px; display: flex; align-items: center;
    border-radius: 6px; transition: color 0.15s;
  }
  .lp-eye:hover { color: #1a56db; }

  .lp-submit {
    width: 100%; padding: 14px;
    background: #1a56db; color: #fff;
    border: none; border-radius: 10px;
    font-size: 15px; font-weight: 700; font-family: inherit;
    cursor: pointer; letter-spacing: 0.3px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 14px rgba(26,86,219,0.3);
    margin-top: 4px;
  }
  .lp-submit:hover:not(:disabled) {
    background: #0f2d5e;
    box-shadow: 0 6px 20px rgba(26,86,219,0.4);
    transform: translateY(-1px);
  }
  .lp-submit:active:not(:disabled) { transform: translateY(0); }
  .lp-submit:disabled { opacity: 0.65; cursor: default; box-shadow: none; }

  .lp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    display: inline-block;
    animation: lp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  .lp-separator {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0 16px; color: #cbd5e1; font-size: 12px;
  }
  .lp-separator::before, .lp-separator::after {
    content: ''; flex: 1; height: 1px; background: #e2eaf6;
  }
  .lp-separator span { color: #8fa8c0; }

  .lp-footer {
    text-align: center; font-size: 13px; color: #6b7a8d;
    margin-bottom: 16px;
  }

  .lp-link {
    color: #1a56db; font-weight: 600; text-decoration: none;
  }
  .lp-link:hover { text-decoration: underline; }

  .lp-disclaimer {
    text-align: center; font-size: 11px;
    color: #b0bec9; line-height: 1.6;
    margin-top: 4px;
  }

  /* ══ DESKTOP: show left panel ══ */
  @media (min-width: 768px) {
    .lp-left        { display: flex; align-items: center; }
    .lp-mobile-brand { display: none; }
    .lp-right       { padding: 48px 48px; }
    .lp-form-wrap   { padding: 40px 36px; }
  }

  @media (min-width: 1024px) {
    .lp-left  { width: 50%; }
    .lp-brand-name { font-size: 32px; }
  }

  /* ══ MOBILE: full-width clean form ══ */
  @media (max-width: 767px) {
    .lp-right {
      padding: 32px 16px 40px;
      background: #fff;
      justify-content: flex-start;
      padding-top: 48px;
    }
    .lp-form-wrap {
      box-shadow: none; border: none;
      padding: 0; background: transparent;
      max-width: 100%;
    }
  }

  @media (max-width: 400px) {
    .lp-heading { font-size: 22px; }
    .lp-mobile-name { font-size: 14px; }
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .lp-right { padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
  }
`;
