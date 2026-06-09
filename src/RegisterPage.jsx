// ============================================================
//  RegisterPage.jsx — LIGTAS LILIW · Full Responsive
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RegisterPage() {
  const { register, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
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
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Punan ang lahat ng fields.'); return;
    }
    if (form.password.length < 8) {
      setError('Ang password ay dapat 8 characters o higit pa.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Hindi magkatugma ang mga password.'); return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.message === 'EMAIL_TAKEN') setError('May account na ang email na iyan.');
      else setError('Hindi makakonekta. Subukan ulit.');
    }
    setLoading(false);
  };

  const pwMismatch = form.confirm && form.confirm !== form.password;

  return (
    <>
      <style>{css}</style>
      <div className="rp-root">

        {/* ── Left panel (desktop only) ── */}
        <div className="rp-left">
          <div className="rp-left-content">
            <div className="rp-brand-logo">
              <ShieldIcon size={36} />
            </div>
            <h1 className="rp-brand-name">LIGTAS LILIW</h1>
            <p className="rp-brand-full">
              Liliw Integrated Government and Technology&#8209;Assisted Safety System
            </p>
            <div className="rp-divider" />
            <p className="rp-tagline">"Mabilis na Responde,<br />Ligtas na Mamamayan."</p>

            <div className="rp-steps">
              <p className="rp-steps-title">Paano mag-report:</p>
              {[
                'Gumawa ng account',
                'Piliin ang uri ng emergency',
                'I-share ang iyong lokasyon',
                'Isumite — tutugon agad ang responder',
              ].map((s, i) => (
                <div key={i} className="rp-step-item">
                  <span className="rp-step-num">{i + 1}</span>
                  <span className="rp-step-text">{s}</span>
                </div>
              ))}
            </div>

            <p className="rp-left-footer">Liliw, Laguna · Official System</p>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="rp-right">

          {/* Mobile-only logo */}
          <div className="rp-mobile-brand">
            <div className="rp-mobile-logo"><ShieldIcon size={22} /></div>
            <div>
              <p className="rp-mobile-name">LIGTAS LILIW</p>
              <p className="rp-mobile-sub">Liliw Emergency Response System</p>
            </div>
          </div>

          <div className="rp-form-wrap">
            <h2 className="rp-heading">Gumawa ng Account</h2>
            <p className="rp-subheading">Para makapag-report ng emergency sa Liliw.</p>

            {error && <div className="rp-error">⚠ {error}</div>}

            <form onSubmit={handleSubmit} className="rp-form">

              <div className="rp-field">
                <label className="rp-label">Buong Pangalan</label>
                <input
                  className="rp-input"
                  type="text" name="name"
                  placeholder="Juan dela Cruz"
                  value={form.name} onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="rp-field">
                <label className="rp-label">Email Address</label>
                <input
                  className="rp-input"
                  type="email" name="email"
                  placeholder="email@example.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="rp-field">
                <label className="rp-label">Password</label>
                <div className="rp-pw-wrap">
                  <input
                    className="rp-input rp-input-pw"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    placeholder="Minimum 8 characters"
                    value={form.password} onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button type="button" className="rp-eye" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {form.password && (
                  <PasswordStrength password={form.password} />
                )}
              </div>

              <div className="rp-field">
                <label className="rp-label">Ulitin ang Password</label>
                <div className="rp-pw-wrap">
                  <input
                    className={`rp-input rp-input-pw ${pwMismatch ? 'rp-input-err' : form.confirm && !pwMismatch ? 'rp-input-ok' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    name="confirm"
                    placeholder="••••••••"
                    value={form.confirm} onChange={handleChange}
                    autoComplete="new-password"
                  />
                  {form.confirm && !pwMismatch && (
                    <span className="rp-check">✓</span>
                  )}
                </div>
                {pwMismatch && (
                  <span className="rp-field-err">⚠ Hindi magkatugma ang password</span>
                )}
              </div>

              <button type="submit" disabled={loading} className="rp-submit">
                {loading
                  ? <><span className="rp-spinner" /> Ginagawa ang account…</>
                  : 'Mag-Register'}
              </button>

            </form>

            <div className="rp-separator"><span>o</span></div>

            <p className="rp-footer">
              Mayroon nang account?{' '}
              <Link to="/login" className="rp-link">Mag-login dito</Link>
            </p>

            <p className="rp-disclaimer">
              Para lamang sa mga residente ng Liliw, Laguna.<br />
              Ang maling paggamit ay may katumbas na parusa.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Password strength indicator ───────────────────────────────
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const label = ['', 'Mahina', 'Katamtaman', 'Malakas', 'Napakalakas'][score];
  const color = ['', '#dc2626', '#d97706', '#2563eb', '#16a34a'][score];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? color : '#e2eaf6',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</p>
    </div>
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

  .rp-root {
    display: flex;
    min-height: 100vh;
    width: 100%;
  }

  /* ── LEFT PANEL ── */
  .rp-left {
    display: none;
    width: 45%;
    flex-shrink: 0;
    background: linear-gradient(160deg, #0f2d5e 0%, #1a56db 60%, #1d6af5 100%);
    position: relative;
    overflow: hidden;
  }
  .rp-left::before {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    top: -100px; right: -100px;
  }
  .rp-left::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.06);
    bottom: -80px; left: -60px;
  }

  .rp-left-content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column;
    justify-content: center; height: 100%;
    padding: 48px 40px;
  }

  .rp-brand-logo {
    width: 64px; height: 64px;
    background: rgba(255,255,255,0.15);
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .rp-brand-name { font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #fff; margin: 0 0 10px; }
  .rp-brand-full { font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.6; margin: 0 0 24px; max-width: 280px; }
  .rp-divider    { width: 40px; height: 2px; background: rgba(255,255,255,0.3); margin-bottom: 20px; }
  .rp-tagline    { font-size: 18px; font-weight: 600; color: #fff; line-height: 1.5; margin-bottom: 32px; font-style: italic; }

  .rp-steps       { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
  .rp-steps-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  .rp-step-item   { display: flex; align-items: center; gap: 12px; }
  .rp-step-num    { width: 26px; height: 26px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.2); }
  .rp-step-text   { font-size: 13px; color: rgba(255,255,255,0.85); font-weight: 500; }
  .rp-left-footer { font-size: 11px; color: rgba(255,255,255,0.4); letter-spacing: 1px; text-transform: uppercase; margin-top: auto; }

  /* ── RIGHT PANEL ── */
  .rp-right {
    flex: 1; background: #f8faff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px; min-height: 100vh;
  }

  .rp-mobile-brand {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 28px; width: 100%; max-width: 420px;
  }
  .rp-mobile-logo { width: 44px; height: 44px; background: #1a56db; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rp-mobile-name { font-size: 16px; font-weight: 800; letter-spacing: 2px; color: #0f2d5e; line-height: 1.1; }
  .rp-mobile-sub  { font-size: 10px; color: #8fa8c0; margin-top: 2px; }

  .rp-form-wrap {
    width: 100%; max-width: 420px;
    background: #fff; border-radius: 20px;
    padding: 36px 32px;
    box-shadow: 0 4px 32px rgba(15,45,94,0.10);
    border: 1px solid #e2eaf6;
  }

  .rp-heading    { font-size: 24px; font-weight: 700; color: #0f1b2d; margin: 0 0 6px; }
  .rp-subheading { font-size: 13px; color: #6b7a8d; margin: 0 0 24px; }

  .rp-error {
    background: #fff5f5; border: 1px solid #fca5a5;
    border-radius: 10px; padding: 11px 14px;
    font-size: 13px; color: #dc2626; margin-bottom: 18px; font-weight: 500;
  }

  .rp-form  { display: flex; flex-direction: column; gap: 16px; }
  .rp-field { display: flex; flex-direction: column; gap: 6px; }
  .rp-label { font-size: 13px; font-weight: 600; color: #374151; }

  .rp-input {
    width: 100%; padding: 13px 16px;
    font-size: 15px; font-family: inherit;
    border: 1.5px solid #e2eaf6; border-radius: 10px;
    outline: none; background: #f8faff; color: #0f1b2d;
    transition: border-color 0.15s, box-shadow 0.15s;
    -webkit-appearance: none;
  }
  .rp-input::placeholder { color: #b0bec9; }
  .rp-input:focus { border-color: #1a56db; background: #fff; box-shadow: 0 0 0 3px rgba(26,86,219,0.10); }
  .rp-input-pw  { padding-right: 48px; }
  .rp-input-err { border-color: #fca5a5 !important; }
  .rp-input-ok  { border-color: #86efac !important; }

  .rp-pw-wrap { position: relative; }

  .rp-eye {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #8fa8c0; padding: 4px; display: flex; align-items: center;
    border-radius: 6px; transition: color 0.15s;
  }
  .rp-eye:hover { color: #1a56db; }

  .rp-check {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    color: #16a34a; font-size: 15px; font-weight: 700;
  }

  .rp-field-err { font-size: 12px; color: #dc2626; font-weight: 500; }

  .rp-submit {
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
  .rp-submit:hover:not(:disabled) { background: #0f2d5e; box-shadow: 0 6px 20px rgba(26,86,219,0.4); transform: translateY(-1px); }
  .rp-submit:active:not(:disabled) { transform: translateY(0); }
  .rp-submit:disabled { opacity: 0.65; cursor: default; box-shadow: none; }

  .rp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    display: inline-block;
    animation: rp-spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  .rp-separator { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
  .rp-separator::before, .rp-separator::after { content: ''; flex: 1; height: 1px; background: #e2eaf6; }
  .rp-separator span { color: #8fa8c0; font-size: 12px; }

  .rp-footer     { text-align: center; font-size: 13px; color: #6b7a8d; margin-bottom: 16px; }
  .rp-link       { color: #1a56db; font-weight: 600; text-decoration: none; }
  .rp-link:hover { text-decoration: underline; }
  .rp-disclaimer { text-align: center; font-size: 11px; color: #b0bec9; line-height: 1.6; }

  /* ══ DESKTOP ══ */
  @media (min-width: 768px) {
    .rp-left         { display: flex; align-items: center; }
    .rp-mobile-brand { display: none; }
    .rp-right        { padding: 48px; }
    .rp-form-wrap    { padding: 40px 36px; }
  }

  @media (min-width: 1024px) {
    .rp-left      { width: 50%; }
    .rp-brand-name { font-size: 32px; }
  }

  /* ══ MOBILE ══ */
  @media (max-width: 767px) {
    .rp-right {
      padding: 32px 16px 40px;
      background: #fff;
      justify-content: flex-start;
      padding-top: 48px;
    }
    .rp-form-wrap {
      box-shadow: none; border: none;
      padding: 0; background: transparent;
      max-width: 100%;
    }
  }

  @media (max-width: 400px) {
    .rp-heading { font-size: 22px; }
  }

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .rp-right { padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
  }
`;
