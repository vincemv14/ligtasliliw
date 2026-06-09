// ============================================================
//  MemberDashboard.jsx — LIGTAS LILIW
//  Member home screen: report history + live status + quick report
//  Mobile-first · Full responsive
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import LiveMap from './LiveMap';

// ── Constants ─────────────────────────────────────────────────

const STATUS_INFO = {
  pending:  { label: 'Pending',            color: '#d97706', bg: '#fffbeb', border: '#fde68a',  step: 0 },
  notified: { label: 'Responder Notified',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',  step: 1 },
  en_route: { label: 'En Route',            color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',  step: 2 },
  resolved: { label: 'Resolved',            color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',  step: 3 },
};

const STATUS_STEPS = ['Submitted', 'Responder Notified', 'En Route', 'Resolved'];

const TYPE_EMOJI = {
  Fire:'🔥', Medical:'🚑', Crime:'🚨',
  Flood:'🌊', Accident:'💥', General:'⚠️',
};

// ── Icons ─────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const p = {
    shield:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Z" />,
    logout:   <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />,
    bell:     <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />,
    plus:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    refresh:  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />,
    map:      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />,
    check:    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />,
    close:    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
    warning:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
    clock:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    inbox:    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} xmlns="http://www.w3.org/2000/svg">
      {p[name]}
    </svg>
  );
};

// ── Helpers ───────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const now = new Date();
  const diffMs = now - dt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs  < 24) return `${diffHrs}h ago`;
  if (diffDays < 7)  return `${diffDays}d ago`;
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Main component ─────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, logout }                            = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate                                    = useNavigate();

  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState(null); // detail modal
  const [showNotifs, setShowNotifs]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // ── Fetch member's own reports ────────────────────────────────
  const fetchReports = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const result = await db.execute(sql`
        SELECT id, incident_type, description, status,
               lat, lng, media_url, responder_note,
               created_at, updated_at
        FROM   incidents
        WHERE  user_id = ${user.id}
        ORDER  BY created_at DESC
      `);
      setReports(result.rows ?? []);
    } catch (err) {
      console.error('fetchReports:', err);
      setError('Hindi ma-load ang mga ulat. Subukan ulit.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Auto-refresh every 8 seconds to catch status updates
  useEffect(() => {
    const t = setInterval(() => fetchReports(true), 8000);
    return () => clearInterval(t);
  }, [fetchReports]);

  // ── Derived stats ─────────────────────────────────────────────
  const stats = {
    total:    reports.length,
    active:   reports.filter(r => ['pending','notified','en_route'].includes(r.status)).length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const filtered = filterStatus === 'all'
    ? reports
    : reports.filter(r => r.status === filterStatus);

  const toggleNotifs = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs(v => !v);
    setSelected(null);
  };

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <style>{css}</style>
      <div className="md-shell">

        {/* ── Header ── */}
        <header className="md-header">
          <div className="md-header-inner">
            <div className="md-logo">
              <div className="md-logo-circle">
                <Icon name="shield" size={18} color="#fff" />
              </div>
              <div>
                <p className="md-logo-title">LIGTAS LILIW</p>
                <p className="md-logo-sub">My Reports</p>
              </div>
            </div>

            <div className="md-header-right">
              {/* Notification bell */}
              <button className="md-icon-btn md-bell-wrap" onClick={toggleNotifs} title="Notifications">
                <Icon name="bell" size={20} color="rgba(255,255,255,0.85)" />
                {unreadCount > 0 && (
                  <span className="md-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Refresh */}
              <button className={`md-icon-btn ${refreshing ? 'spinning' : ''}`}
                onClick={() => fetchReports(true)} title="Refresh">
                <Icon name="refresh" size={20} color="rgba(255,255,255,0.85)" />
              </button>

              <span className="md-user-name">{user?.name}</span>

              <button className="md-icon-btn" onClick={logout} title="Logout">
                <Icon name="logout" size={20} color="rgba(255,255,255,0.7)" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Notification panel ── */}
        {showNotifs && (
          <div className="md-notif-panel">
            <div className="md-notif-inner">
              <div className="md-notif-head">
                <p className="md-notif-title">🔔 Aking Notifications</p>
                <button className="md-icon-btn-sm" onClick={() => setShowNotifs(false)}>
                  <Icon name="close" size={16} color="#6b7a8d" />
                </button>
              </div>
              {notifications.length === 0
                ? <p className="md-notif-empty">Walang notifications pa.</p>
                : notifications.slice(0, 15).map(n => (
                  <div key={n.id} className={`md-notif-item ${!n.is_read ? 'unread' : ''}`}>
                    <span className="md-notif-dot" />
                    <div>
                      <p className="md-notif-msg">{n.message}</p>
                      <p className="md-notif-time">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── Welcome + CTA ── */}
        <div className="md-hero">
          <div className="md-hero-inner">
            <div className="md-hero-text">
              <h2 className="md-hero-title">Kumusta, {user?.name?.split(' ')[0]}!</h2>
              <p className="md-hero-sub">
                {stats.active > 0
                  ? `Mayroon kang ${stats.active} aktibong ulat.`
                  : 'Walang aktibong emergency sa ngayon.'}
              </p>
            </div>
            <button className="md-report-btn" onClick={() => navigate('/report')}>
              <Icon name="warning" size={18} color="#fff" />
              <span>Mag-report ng Emergency</span>
            </button>
          </div>
        </div>

        <div className="md-body">

          {/* ── Stats row ── */}
          <div className="md-stats">
            <div className="md-stat-card">
              <p className="md-stat-val" style={{ color: '#1a56db' }}>{stats.total}</p>
              <p className="md-stat-label">Total Reports</p>
            </div>
            <div className="md-stat-card">
              <p className="md-stat-val" style={{ color: '#d97706' }}>{stats.active}</p>
              <p className="md-stat-label">Active</p>
            </div>
            <div className="md-stat-card">
              <p className="md-stat-val" style={{ color: '#16a34a' }}>{stats.resolved}</p>
              <p className="md-stat-label">Resolved</p>
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="md-filters-wrap">
            <div className="md-filters">
              {[
                { value: 'all',      label: 'Lahat' },
                { value: 'pending',  label: 'Pending' },
                { value: 'notified', label: 'Notified' },
                { value: 'en_route', label: 'En Route' },
                { value: 'resolved', label: 'Resolved' },
              ].map(f => (
                <button
                  key={f.value}
                  className={`md-filter-btn ${filterStatus === f.value ? 'active' : ''}`}
                  onClick={() => setFilterStatus(f.value)}
                >
                  {f.label}
                  {f.value !== 'all' && (
                    <span className="md-filter-count">
                      {reports.filter(r => r.status === f.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Reports list ── */}
          {error && <div className="md-error">⚠ {error}</div>}

          {loading ? (
            <div className="md-loading">
              <span className="md-spinner" /> Kinukuha ang mga ulat…
            </div>
          ) : filtered.length === 0 ? (
            <div className="md-empty">
              <div className="md-empty-icon">
                <Icon name="inbox" size={40} color="#bcd0f0" />
              </div>
              <p className="md-empty-title">
                {filterStatus === 'all' ? 'Wala pang ulat' : `Walang ${filterStatus} na ulat`}
              </p>
              <p className="md-empty-sub">
                {filterStatus === 'all'
                  ? 'I-tap ang "Mag-report" para magsumite ng emergency.'
                  : 'Walang ulat sa kategoryang ito.'}
              </p>
              {filterStatus === 'all' && (
                <button className="md-cta-btn" onClick={() => navigate('/report')}>
                  <Icon name="plus" size={16} color="#fff" /> Mag-report ngayon
                </button>
              )}
            </div>
          ) : (
            <div className="md-list">
              {filtered.map(r => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onClick={() => setSelected(r)}
                  Icon={Icon}
                />
              ))}
            </div>
          )}

        </div>

        {/* ── Floating action button (mobile) ── */}
        <button className="md-fab" onClick={() => navigate('/report')}>
          <Icon name="plus" size={24} color="#fff" />
        </button>

        {/* ── Detail modal ── */}
        {selected && (
          <ReportModal
            report={selected}
            onClose={() => setSelected(null)}
            Icon={Icon}
          />
        )}

      </div>
    </>
  );
}

// ── Report Card ───────────────────────────────────────────────
function ReportCard({ report, onClick, Icon }) {
  const st   = STATUS_INFO[report.status] ?? STATUS_INFO.pending;
  const step = st.step ?? 0;

  return (
    <div className="md-card" onClick={onClick}>
      {/* Top row */}
      <div className="md-card-top">
        <div className="md-card-left">
          <span className="md-card-emoji">{TYPE_EMOJI[report.incident_type] ?? '⚠️'}</span>
          <div>
            <p className="md-card-type">{report.incident_type}</p>
            <p className="md-card-time">
              <Icon name="clock" size={11} color="#8fa8c0" /> {formatDate(report.created_at)}
            </p>
          </div>
        </div>
        <span className="md-card-badge"
          style={{ color: st.color, background: st.bg, borderColor: st.border }}>
          {st.label}
        </span>
      </div>

      {/* Description */}
      <p className="md-card-desc">{report.description}</p>

      {/* Mini status track */}
      <div className="md-mini-track">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className="md-mini-item">
            <div className={`md-mini-dot ${i <= step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
              {i < step && <Icon name="check" size={9} color="#fff" />}
              {i === step && <span className="md-mini-pulse" />}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`md-mini-line ${i < step ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>
      <div className="md-mini-labels">
        {STATUS_STEPS.map((s, i) => (
          <span key={s} className={`md-mini-label ${i <= step ? 'done' : ''}`}>{s}</span>
        ))}
      </div>

      {/* Responder note preview */}
      {report.responder_note && (
        <div className="md-card-note">
          📋 <span>{report.responder_note}</span>
        </div>
      )}

      <p className="md-card-tap">Tap para sa detalye →</p>
    </div>
  );
}

// ── Report Detail Modal ───────────────────────────────────────
function ReportModal({ report, onClose, Icon }) {
  const st   = STATUS_INFO[report.status] ?? STATUS_INFO.pending;
  const step = st.step ?? 0;

  const fullDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="md-modal-head">
          <div className="md-modal-title-row">
            <span className="md-modal-emoji">{TYPE_EMOJI[report.incident_type] ?? '⚠️'}</span>
            <div>
              <p className="md-modal-type">{report.incident_type} Emergency</p>
              <p className="md-modal-id">
                Report #{typeof report.id === 'string'
                  ? report.id.slice(0,8).toUpperCase()
                  : String(report.id).padStart(6,'0')}
              </p>
            </div>
          </div>
          <button className="md-icon-btn-sm" onClick={onClose}>
            <Icon name="close" size={20} color="#6b7a8d" />
          </button>
        </div>

        <div className="md-modal-body">

          {/* Full status track */}
          <div className="md-modal-sec">
            <p className="md-modal-label">Status ng Ulat</p>
            <div className="md-full-track">
              {STATUS_STEPS.map((s, i) => (
                <div key={s} className="md-full-item">
                  <div className={`md-full-dot ${i <= step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                    {i < step
                      ? <Icon name="check" size={14} color="#fff" />
                      : i === step
                        ? <span className="md-full-pulse" />
                        : <span className="md-full-num">{i + 1}</span>}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`md-full-line ${i < step ? 'done' : ''}`} />
                  )}
                  <span className={`md-full-label ${i <= step ? 'done' : ''}`}>{s}</span>
                </div>
              ))}
            </div>

            {/* Current status badge */}
            <div className="md-status-pill"
              style={{ color: st.color, background: st.bg, borderColor: st.border }}>
              {st.label}
              {report.status === 'en_route' && (
                <span className="md-en-route-pulse" />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="md-modal-sec">
            <p className="md-modal-label">Detalye</p>
            <p className="md-modal-text">{report.description}</p>
          </div>

          {/* Timestamps */}
          <div className="md-modal-sec md-modal-times">
            <div className="md-time-row">
              <span className="md-time-label">Isinumite:</span>
              <span className="md-time-val">{fullDate(report.created_at)}</span>
            </div>
            <div className="md-time-row">
              <span className="md-time-label">Na-update:</span>
              <span className="md-time-val">{fullDate(report.updated_at)}</span>
            </div>
          </div>

          {/* Location — Live Map */}
          <div className="md-modal-sec">
            <p className="md-modal-label">
              {report.status === 'en_route' ? '🔴 Live Responder Tracking' : 'GPS Lokasyon'}
            </p>
            <LiveMap
              incidentLat={report.lat ? Number(report.lat) : null}
              incidentLng={report.lng ? Number(report.lng) : null}
              incidentId={report.id}
              incidentType={report.incident_type}
              responderActive={report.status === 'en_route' || report.status === 'notified'}
              height="260px"
            />
          </div>

          {/* Photo */}
          {report.media_url && (
            <div className="md-modal-sec">
              <p className="md-modal-label">Litrato</p>
              <img src={report.media_url} alt="evidence" className="md-modal-photo" />
            </div>
          )}

          {/* Responder note */}
          {report.responder_note && (
            <div className="md-modal-sec">
              <p className="md-modal-label">Note mula sa Responder</p>
              <div className="md-modal-note">
                📋 {report.responder_note}
              </div>
            </div>
          )}

          {/* If resolved */}
          {report.status === 'resolved' && (
            <div className="md-resolved-banner">
              <Icon name="check" size={18} color="#16a34a" />
              <span>Ang iyong emergency ay natugunan na. Salamat sa pag-report.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:#eff6ff; }
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

.md-shell { min-height:100vh; width:100%; background:#eff6ff; font-family:'DM Sans',system-ui,sans-serif; padding-bottom:80px; }

/* ── Header ── */
.md-header { background:#0f2d5e; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(15,45,94,0.3); }
.md-header-inner { max-width:1000px; margin:0 auto; padding:0 14px; height:60px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
.md-logo { display:flex; align-items:center; gap:9px; min-width:0; flex-shrink:1; overflow:hidden; }
.md-logo-circle { width:34px; height:34px; background:#1a56db; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.md-logo-title { font-size:13px; font-weight:800; letter-spacing:1.5px; color:#fff; line-height:1.1; white-space:nowrap; }
.md-logo-sub { font-size:9px; color:rgba(255,255,255,0.45); white-space:nowrap; }
.md-header-right { display:flex; align-items:center; gap:2px; flex-shrink:0; }
.md-user-name { font-size:11px; color:rgba(255,255,255,0.65); max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0 6px; }
.md-icon-btn { position:relative; background:none; border:none; cursor:pointer; padding:7px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; flex-shrink:0; }
.md-icon-btn:hover { background:rgba(255,255,255,0.1); }
.md-icon-btn.spinning svg { animation:md-spin 1s linear infinite; }
@keyframes md-spin { to { transform:rotate(360deg); } }
.md-bell-wrap { position:relative; }
.md-bell-badge { position:absolute; top:2px; right:2px; min-width:16px; height:16px; background:#e8001d; border-radius:8px; font-size:9px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; padding:0 3px; border:2px solid #0f2d5e; }

/* ── Notif panel ── */
.md-notif-panel { background:#fff; border-bottom:1px solid #e2eaf6; box-shadow:0 4px 16px rgba(15,45,94,0.08); max-height:300px; overflow-y:auto; }
.md-notif-inner { max-width:1000px; margin:0 auto; padding:12px 14px; }
.md-notif-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.md-notif-title { font-size:14px; font-weight:700; color:#0f1b2d; }
.md-icon-btn-sm { background:none; border:none; cursor:pointer; padding:4px; border-radius:6px; display:flex; align-items:center; }
.md-icon-btn-sm:hover { background:#f1f5f9; }
.md-notif-empty { font-size:13px; color:#8fa8c0; padding:8px 0; }
.md-notif-item { display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid #f1f5f9; }
.md-notif-item.unread .md-notif-dot { background:#1a56db; }
.md-notif-dot { width:8px; height:8px; border-radius:50%; background:#e2eaf6; flex-shrink:0; margin-top:4px; }
.md-notif-msg { font-size:13px; color:#0f1b2d; line-height:1.4; }
.md-notif-time { font-size:11px; color:#8fa8c0; margin-top:2px; font-family:'DM Mono',monospace; }

/* ── Hero ── */
.md-hero { background:linear-gradient(135deg,#0f2d5e 0%,#1a56db 100%); padding:20px 14px; }
.md-hero-inner { max-width:1000px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
.md-hero-title { font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; }
.md-hero-sub { font-size:13px; color:rgba(255,255,255,0.75); line-height:1.4; }
.md-report-btn { display:flex; align-items:center; gap:8px; background:#fff; color:#1a56db; border:none; border-radius:10px; padding:12px 20px; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.15s; box-shadow:0 4px 12px rgba(0,0,0,0.15); flex-shrink:0; }
.md-report-btn:hover { background:#eff6ff; transform:translateY(-1px); }

/* ── Body ── */
.md-body { max-width:1000px; margin:0 auto; padding:16px 12px 20px; display:flex; flex-direction:column; gap:14px; }

/* ── Stats ── */
.md-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.md-stat-card { background:#fff; border:1px solid #e2eaf6; border-radius:12px; padding:14px 10px; text-align:center; box-shadow:0 1px 4px rgba(15,45,94,0.06); }
.md-stat-val { font-size:26px; font-weight:700; line-height:1; margin-bottom:4px; }
.md-stat-label { font-size:10px; color:#6b7a8d; font-weight:500; }

/* ── Filters ── */
.md-filters-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.md-filters { display:flex; gap:6px; width:max-content; min-width:100%; padding-bottom:4px; }
.md-filter-btn { background:#fff; border:1.5px solid #e2eaf6; border-radius:20px; padding:6px 14px; font-family:inherit; font-size:12px; font-weight:500; color:#6b7a8d; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:5px; white-space:nowrap; flex-shrink:0; }
.md-filter-btn:hover { border-color:#1a56db; color:#1a56db; }
.md-filter-btn.active { background:#1a56db; border-color:#1a56db; color:#fff; }
.md-filter-count { background:rgba(255,255,255,0.25); border-radius:10px; padding:1px 6px; font-size:10px; }
.md-filter-btn:not(.active) .md-filter-count { background:#f1f5f9; color:#6b7a8d; }

/* ── Error / loading / empty ── */
.md-error { background:#fff5f5; border:1px solid #fca5a5; border-radius:10px; padding:12px 14px; font-size:13px; color:#dc2626; font-weight:500; }
.md-loading { display:flex; align-items:center; gap:10px; padding:48px 0; color:#6b7a8d; font-size:14px; justify-content:center; }
.md-spinner { width:20px; height:20px; border:2px solid #dbeafe; border-top-color:#1a56db; border-radius:50%; display:inline-block; animation:md-spin 0.7s linear infinite; }
.md-empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:48px 16px; text-align:center; }
.md-empty-icon { width:72px; height:72px; background:#eff6ff; border-radius:20px; display:flex; align-items:center; justify-content:center; }
.md-empty-title { font-size:16px; font-weight:700; color:#0f1b2d; }
.md-empty-sub { font-size:13px; color:#8fa8c0; line-height:1.5; max-width:260px; }
.md-cta-btn { display:flex; align-items:center; gap:8px; background:#1a56db; color:#fff; border:none; border-radius:10px; padding:12px 24px; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; margin-top:8px; box-shadow:0 4px 14px rgba(26,86,219,0.3); transition:all 0.15s; }
.md-cta-btn:hover { background:#0f2d5e; }

/* ── Cards ── */
.md-list { display:flex; flex-direction:column; gap:10px; }
.md-card { background:#fff; border:1.5px solid #e2eaf6; border-radius:14px; padding:16px; cursor:pointer; transition:all 0.15s; box-shadow:0 1px 4px rgba(15,45,94,0.05); display:flex; flex-direction:column; gap:10px; }
.md-card:hover { border-color:#bfdbfe; box-shadow:0 4px 16px rgba(26,86,219,0.1); transform:translateY(-1px); }
.md-card:active { transform:translateY(0); }
.md-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.md-card-left { display:flex; align-items:center; gap:10px; min-width:0; }
.md-card-emoji { font-size:28px; flex-shrink:0; }
.md-card-type { font-size:15px; font-weight:700; color:#0f1b2d; }
.md-card-time { display:flex; align-items:center; gap:4px; font-size:11px; color:#8fa8c0; margin-top:3px; }
.md-card-badge { font-size:11px; font-weight:600; padding:5px 10px; border-radius:20px; border:1px solid; white-space:nowrap; flex-shrink:0; }
.md-card-desc { font-size:13px; color:#4a637a; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

/* Mini status track */
.md-mini-track { display:flex; align-items:center; gap:0; }
.md-mini-item { display:flex; align-items:center; flex:1; }
.md-mini-dot { width:20px; height:20px; border-radius:50%; border:2px solid #e2eaf6; background:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.3s; }
.md-mini-dot.done { background:#1a56db; border-color:#1a56db; }
.md-mini-dot.active { border-color:#1a56db; background:#fff; box-shadow:0 0 0 3px rgba(26,86,219,0.15); }
.md-mini-line { flex:1; height:2px; background:#e2eaf6; transition:background 0.3s; }
.md-mini-line.done { background:#1a56db; }
.md-mini-pulse { width:8px; height:8px; background:#1a56db; border-radius:50%; display:block; animation:md-blink 1s infinite; }
@keyframes md-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
.md-mini-labels { display:flex; justify-content:space-between; }
.md-mini-label { font-size:9px; color:#b0bec9; text-align:center; flex:1; line-height:1.3; transition:color 0.3s; padding:0 2px; }
.md-mini-label.done { color:#1a56db; font-weight:600; }

.md-card-note { font-size:12px; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:8px 10px; line-height:1.5; }
.md-card-tap { font-size:11px; color:#bcd0f0; text-align:right; }

/* ── Floating action btn ── */
.md-fab { position:fixed; bottom:24px; right:20px; width:56px; height:56px; background:#1a56db; border:none; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 6px 24px rgba(26,86,219,0.45); transition:all 0.15s; z-index:50; -webkit-tap-highlight-color:transparent; }
.md-fab:hover { background:#0f2d5e; transform:scale(1.08); }
.md-fab:active { transform:scale(0.96); }

/* ── Detail modal ── */
.md-overlay { position:fixed; inset:0; background:rgba(15,27,45,0.55); z-index:200; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(2px); }
.md-modal { background:#fff; border-radius:20px 20px 0 0; width:100%; max-width:640px; max-height:92vh; overflow-y:auto; animation:md-slideUp 0.3s ease; }
@keyframes md-slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
.md-modal-head { display:flex; align-items:flex-start; justify-content:space-between; padding:18px 18px 14px; gap:12px; position:sticky; top:0; background:#fff; border-bottom:1px solid #f1f5f9; z-index:1; }
.md-modal-title-row { display:flex; align-items:center; gap:12px; }
.md-modal-emoji { font-size:32px; }
.md-modal-type { font-size:17px; font-weight:700; color:#0f1b2d; }
.md-modal-id { font-size:12px; color:#8fa8c0; font-family:'DM Mono',monospace; margin-top:3px; }
.md-modal-body { padding:16px 18px 32px; display:flex; flex-direction:column; gap:18px; }
.md-modal-sec { display:flex; flex-direction:column; gap:8px; }
.md-modal-label { font-size:11px; font-weight:700; color:#8fa8c0; letter-spacing:1px; text-transform:uppercase; }
.md-modal-text { font-size:14px; color:#0f1b2d; line-height:1.6; }

/* Full track in modal */
.md-full-track { display:flex; align-items:flex-start; gap:0; }
.md-full-item { display:flex; flex-direction:column; align-items:center; flex:1; position:relative; gap:4px; }
.md-full-dot { width:32px; height:32px; border-radius:50%; border:2px solid #e2eaf6; background:#fff; display:flex; align-items:center; justify-content:center; position:relative; z-index:1; transition:all 0.35s; }
.md-full-dot.done { background:#1a56db; border-color:#1a56db; }
.md-full-dot.active { border-color:#1a56db; box-shadow:0 0 0 4px rgba(26,86,219,0.15); }
.md-full-num { font-family:'DM Mono',monospace; font-size:11px; color:#8fa8c0; }
.md-full-pulse { width:12px; height:12px; background:#1a56db; border-radius:50%; display:block; animation:md-blink 1s infinite; }
.md-full-line { position:absolute; top:16px; left:50%; width:100%; height:2px; background:#e2eaf6; transition:background 0.35s; }
.md-full-line.done { background:#1a56db; }
.md-full-label { font-size:9px; color:#8fa8c0; text-align:center; line-height:1.3; transition:color 0.35s; padding:0 2px; }
.md-full-label.done { color:#1a56db; font-weight:600; }

.md-status-pill { display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:20px; border:1px solid; font-size:13px; font-weight:600; margin-top:4px; }
.md-en-route-pulse { width:8px; height:8px; background:currentColor; border-radius:50%; animation:md-blink 0.8s infinite; }

.md-modal-times { gap:6px; }
.md-time-row { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.md-time-label { font-size:11px; color:#8fa8c0; font-weight:600; white-space:nowrap; }
.md-time-val { font-size:12px; color:#4a637a; font-family:'DM Mono',monospace; }

.md-modal-map-link { display:flex; align-items:center; gap:8px; font-size:13px; color:#1a56db; text-decoration:none; font-weight:500; padding:12px 14px; background:#eff6ff; border-radius:10px; border:1px solid #dbeafe; flex-wrap:wrap; }
.md-modal-map-link:hover { background:#dbeafe; }
.md-map-open { font-size:11px; color:#8fa8c0; margin-left:auto; }
.md-modal-photo { width:100%; border-radius:10px; max-height:220px; object-fit:cover; border:1px solid #e2eaf6; }
.md-modal-note { background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:12px 14px; font-size:13px; color:#92400e; line-height:1.6; }

.md-resolved-banner { display:flex; align-items:center; gap:10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; font-size:13px; color:#16a34a; font-weight:500; line-height:1.5; }

/* ══ RESPONSIVE ══ */

@media (max-width:380px) {
  .md-logo-title { font-size:11px; letter-spacing:1px; }
  .md-logo-sub   { display:none; }
  .md-user-name  { display:none; }
  .md-hero-title { font-size:17px; }
  .md-report-btn { padding:10px 14px; font-size:12px; }
  .md-stat-val   { font-size:22px; }
  .md-card       { padding:12px; }
  .md-body       { padding:12px 10px 20px; }
}

@media (max-width:480px) {
  .md-logo-sub  { display:none; }
  .md-user-name { display:none; }
  .md-hero-inner { gap:12px; }
  .md-hero-title { font-size:18px; }
  .md-stat-val   { font-size:22px; }
  .md-modal { border-radius:16px 16px 0 0; }
}

@media (min-width:481px) and (max-width:767px) {
  .md-hero-title { font-size:20px; }
  .md-fab { bottom:28px; right:24px; }
}

@media (min-width:768px) {
  .md-shell { padding-bottom:40px; }
  .md-hero { padding:28px 20px; }
  .md-hero-title { font-size:24px; }
  .md-report-btn { padding:14px 28px; font-size:14px; }
  .md-body { padding:20px 20px 32px; gap:16px; }
  .md-stat-val { font-size:28px; }
  .md-stats { gap:12px; }
  .md-fab { display:none; } /* on desktop the hero button is enough */
  .md-overlay { align-items:center; }
  .md-modal { border-radius:16px; max-height:85vh; }
  @keyframes md-slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .md-filters-wrap { overflow-x:visible; }
  .md-filters { width:auto; min-width:auto; }
  .md-header-inner { padding:0 20px; }
  .md-user-name { display:block; max-width:120px; }
  .md-logo-sub { display:block; }
}

@media (min-width:1024px) {
  .md-list { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  .md-stats { grid-template-columns:repeat(3,1fr); gap:14px; }
}

@supports (padding-bottom:env(safe-area-inset-bottom)) {
  .md-shell     { padding-bottom:calc(80px + env(safe-area-inset-bottom)); }
  .md-modal-body { padding-bottom:calc(32px + env(safe-area-inset-bottom)); }
  .md-fab        { bottom:calc(24px + env(safe-area-inset-bottom)); }
}
`;
