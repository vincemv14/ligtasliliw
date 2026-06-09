// ============================================================
//  AdminDashboard.jsx — LIGTAS LILIW · Full Responsive
//  Phase 2: Live Map + Responder Broadcasting
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import LiveMap, { useResponderBroadcast } from './LiveMap';

// ── Constants ─────────────────────────────────────────────────

const STATUSES = [
  { value: 'pending',  label: 'Pending',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 'notified', label: 'Notified', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'en_route', label: 'En Route', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'resolved', label: 'Resolved', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
];

const TYPE_ICONS = {
  Fire:'🔥', Medical:'🚑', Crime:'🚨',
  Flood:'🌊', Accident:'💥', General:'⚠️',
};

// ── Icon component ────────────────────────────────────────────

const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const p = {
    shield:  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Z" />,
    bell:    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />,
    logout:  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />,
    close:   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
    map:     <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />,
    note:    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />,
    check:   <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />,
    filter:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />,
    photo:   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} xmlns="http://www.w3.org/2000/svg">
      {p[name]}
    </svg>
  );
};

// ── Helpers ───────────────────────────────────────────────────

const statusInfo = (v) => STATUSES.find(s => s.value === v) ?? STATUSES[0];

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
};

// ── Main component ────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, logout }                            = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  // ── State (ALL hooks must be here, inside the component) ──
  const [incidents, setIncidents]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected]         = useState(null);
  const [showNotifs, setShowNotifs]     = useState(false);
  const [noteText, setNoteText]         = useState('');
  const [savingNote, setSavingNote]     = useState(false);
  const [updatingId, setUpdatingId]     = useState(null);
  const [stats, setStats]               = useState({ total:0, pending:0, en_route:0, resolved:0 });

  // Change 2 — broadcasting state (must be inside the component)
  const [broadcasting, setBroadcasting] = useState(null);
  // null | { incidentId: string, responderId: string }

  // Change 3 — responder GPS broadcast hook (must be inside the component)
  useResponderBroadcast({
    incidentId:  broadcasting?.incidentId  ?? null,
    responderId: broadcasting?.responderId ?? null,
    active:      !!broadcasting,
  });

  // ── Fetch incidents ────────────────────────────────────────

  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const result = await db.execute(sql`
        SELECT i.id, i.incident_type, i.description, i.status,
               i.lat, i.lng, i.media_url, i.responder_note,
               i.created_at, i.updated_at,
               u.name  AS reporter_name,
               u.email AS reporter_email
        FROM   incidents i
        LEFT   JOIN users u ON u.id = i.user_id
        ORDER  BY i.created_at DESC
      `);
      const rows = result.rows ?? [];
      setIncidents(rows);
      setStats({
        total:    rows.length,
        pending:  rows.filter(r => r.status === 'pending').length,
        en_route: rows.filter(r => r.status === 'en_route').length,
        resolved: rows.filter(r => r.status === 'resolved').length,
      });
    } catch (err) { console.error('fetchIncidents:', err); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const t = setInterval(() => fetchIncidents(true), 10000);
    return () => clearInterval(t);
  }, [fetchIncidents]);

  // ── Actions ────────────────────────────────────────────────

  const updateStatus = async (incidentId, newStatus) => {
    setUpdatingId(incidentId);
    try {
      await db.execute(sql`
        UPDATE incidents SET status = ${newStatus} WHERE id = ${incidentId}
      `);
      setIncidents(prev =>
        prev.map(i => i.id === incidentId ? { ...i, status: newStatus } : i)
      );
      if (selected?.id === incidentId) {
        setSelected(prev => ({ ...prev, status: newStatus }));
      }
      // Stop broadcasting if resolving
      if (newStatus === 'resolved' && broadcasting?.incidentId === incidentId) {
        setBroadcasting(null);
      }
      await fetchIncidents(true);
    } catch (err) {
      console.error('updateStatus:', err);
      alert('Failed to update status. Try again.');
    }
    setUpdatingId(null);
  };

  const saveNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await db.execute(sql`
        UPDATE incidents SET responder_note = ${noteText.trim()} WHERE id = ${selected.id}
      `);
      setIncidents(prev =>
        prev.map(i => i.id === selected.id ? { ...i, responder_note: noteText.trim() } : i)
      );
      setSelected(prev => ({ ...prev, responder_note: noteText.trim() }));
      setNoteText('');
    } catch (err) { console.error('saveNote:', err); }
    setSavingNote(false);
  };

  const openDetail = (incident) => {
    setSelected(incident);
    setNoteText(incident.responder_note ?? '');
    setShowNotifs(false);
  };

  const toggleNotifs = () => {
    if (!showNotifs) markAllRead();
    setShowNotifs(v => !v);
    setSelected(null);
  };

  const filtered = filterStatus === 'all'
    ? incidents
    : incidents.filter(i => i.status === filterStatus);

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>
      <div className="ad-shell">

        {/* ── Header ── */}
        <header className="ad-header">
          <div className="ad-header-inner">
            <div className="ad-logo">
              <div className="ad-logo-circle">
                <Icon name="shield" size={18} color="#fff" />
              </div>
              <div>
                <p className="ad-logo-title">LIGTAS LILIW</p>
                <p className="ad-logo-sub">Admin Dashboard</p>
              </div>
            </div>

            <div className="ad-header-right">
              <span className="ad-user-name">{user?.name}</span>

              <button
                className={`ad-icon-btn ${refreshing ? 'spinning' : ''}`}
                onClick={() => fetchIncidents(true)}
                title="Refresh"
              >
                <Icon name="refresh" size={20} color="rgba(255,255,255,0.85)" />
              </button>

              <button className="ad-icon-btn ad-bell-wrap" onClick={toggleNotifs} title="Notifications">
                <Icon name="bell" size={20} color="rgba(255,255,255,0.85)" />
                {unreadCount > 0 && (
                  <span className="ad-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Show live indicator when broadcasting */}
              {broadcasting && (
                <div className="ad-live-pill">
                  <span className="ad-live-dot" /> LIVE
                </div>
              )}

              <button className="ad-icon-btn" onClick={logout} title="Logout">
                <Icon name="logout" size={20} color="rgba(255,255,255,0.7)" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Notification panel ── */}
        {showNotifs && (
          <div className="ad-notif-panel">
            <div className="ad-notif-inner">
              <div className="ad-notif-head">
                <p className="ad-notif-title">🔔 Notifications</p>
                <button className="ad-icon-btn-sm" onClick={() => setShowNotifs(false)}>
                  <Icon name="close" size={16} color="#6b7a8d" />
                </button>
              </div>
              {notifications.length === 0
                ? <p className="ad-notif-empty">Walang notifications.</p>
                : notifications.slice(0, 20).map(n => (
                  <div key={n.id} className={`ad-notif-item ${!n.is_read ? 'unread' : ''}`}>
                    <span className="ad-notif-dot" />
                    <div>
                      <p className="ad-notif-msg">{n.message}</p>
                      <p className="ad-notif-time">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div className="ad-body">

          {/* Stats row */}
          <div className="ad-stats">
            {[
              { label: 'Total',    value: stats.total,    color: '#1a56db' },
              { label: 'Pending',  value: stats.pending,  color: '#d97706' },
              { label: 'En Route', value: stats.en_route, color: '#7c3aed' },
              { label: 'Resolved', value: stats.resolved, color: '#16a34a' },
            ].map(s => (
              <div key={s.label} className="ad-stat-card">
                <p className="ad-stat-val" style={{ color: s.color }}>{s.value}</p>
                <p className="ad-stat-label">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="ad-filters-wrap">
            <div className="ad-filters">
              {[{ value: 'all', label: 'Lahat' }, ...STATUSES].map(f => (
                <button
                  key={f.value}
                  className={`ad-filter-btn ${filterStatus === f.value ? 'active' : ''}`}
                  onClick={() => setFilterStatus(f.value)}
                >
                  {f.label}
                  {f.value !== 'all' && (
                    <span className="ad-filter-count">
                      {incidents.filter(i => i.status === f.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Incident list */}
          {loading ? (
            <div className="ad-loading">
              <span className="ad-spinner" /> Kinukuha ang mga ulat…
            </div>
          ) : filtered.length === 0 ? (
            <div className="ad-empty">Walang mga ulat na natagpuan.</div>
          ) : (
            <div className="ad-list">
              {filtered.map(incident => {
                const st = statusInfo(incident.status);
                return (
                  <div
                    key={incident.id}
                    className={`ad-card ${selected?.id === incident.id ? 'selected' : ''}`}
                    onClick={() => openDetail(incident)}
                  >
                    <div className="ad-card-top">
                      <div className="ad-card-left">
                        <span className="ad-type-icon">
                          {TYPE_ICONS[incident.incident_type] ?? '⚠️'}
                        </span>
                        <div>
                          <p className="ad-card-type">{incident.incident_type}</p>
                          <p className="ad-card-reporter">
                            {incident.reporter_name ?? 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      <span className="ad-status-badge"
                        style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </div>

                    <p className="ad-card-desc">{incident.description}</p>

                    <div className="ad-card-meta">
                      <span className="ad-card-time">{formatDate(incident.created_at)}</span>
                      {incident.lat && (
                        <a className="ad-map-link"
                          href={`https://maps.google.com/?q=${incident.lat},${incident.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}>
                          <Icon name="map" size={13} color="#1a56db" /> Map
                        </a>
                      )}
                    </div>

                    {/* Quick status buttons — scrollable on mobile */}
                    <div className="ad-qs-row" onClick={e => e.stopPropagation()}>
                      {STATUSES.map(s => (
                        <button
                          key={s.value}
                          className={`ad-qs-btn ${incident.status === s.value ? 'active' : ''}`}
                          style={incident.status === s.value
                            ? { background: s.color, color: '#fff', borderColor: s.color }
                            : {}}
                          disabled={updatingId === incident.id}
                          onClick={() => updateStatus(incident.id, s.value)}
                        >
                          {updatingId === incident.id && incident.status !== s.value
                            ? <span className="ad-spinner-xs" /> : null}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Detail modal ── */}
        {selected && (
          <div className="ad-overlay" onClick={() => setSelected(null)}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div className="ad-modal-head">
                <div>
                  <p className="ad-modal-type">
                    {TYPE_ICONS[selected.incident_type]} {selected.incident_type}
                  </p>
                  <p className="ad-modal-reporter">
                    {selected.reporter_name ?? 'Anonymous'} · {selected.reporter_email ?? '—'}
                  </p>
                </div>
                <button className="ad-icon-btn-sm" onClick={() => setSelected(null)}>
                  <Icon name="close" size={20} color="#6b7a8d" />
                </button>
              </div>

              <div className="ad-modal-body">

                {/* ── Status section ── */}
                <div className="ad-modal-sec">
                  <p className="ad-modal-label">Status</p>
                  <div className="ad-modal-statuses">
                    {STATUSES.map(s => (
                      <button
                        key={s.value}
                        className={`ad-ms-btn ${selected.status === s.value ? 'active' : ''}`}
                        style={selected.status === s.value
                          ? { background: s.color, color: '#fff', borderColor: s.color }
                          : {}}
                        disabled={updatingId === selected.id}
                        onClick={() => updateStatus(selected.id, s.value)}
                      >
                        {selected.status === s.value && (
                          <Icon name="check" size={12} color="#fff" />
                        )}
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Change 5 — Broadcast button (only when En Route) */}
                  {selected.status === 'en_route' && (
                    <div className="ad-broadcast-wrap">
                      {broadcasting?.incidentId === selected.id ? (
                        <button
                          className="ad-broadcast-btn ad-broadcast-stop"
                          onClick={() => setBroadcasting(null)}
                        >
                          <span className="ad-broadcast-dot" />
                          Stop Broadcasting Location
                        </button>
                      ) : (
                        <button
                          className="ad-broadcast-btn ad-broadcast-start"
                          onClick={() => setBroadcasting({
                            incidentId:  selected.id,
                            responderId: user.id,
                          })}
                        >
                          📍 Start Broadcasting My Location
                        </button>
                      )}
                      {broadcasting?.incidentId === selected.id && (
                        <p className="ad-broadcast-status">
                          ● Sending live GPS every 5 seconds — visible to reporter on map
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Description ── */}
                <div className="ad-modal-sec">
                  <p className="ad-modal-label">Description</p>
                  <p className="ad-modal-text">{selected.description}</p>
                </div>

                {/* ── Change 4: Live Map (replaces plain GPS link) ── */}
                <div className="ad-modal-sec">
                  <p className="ad-modal-label">
                    {selected.status === 'en_route'
                      ? '🔴 Live Map — Responder Tracking'
                      : 'GPS Location'}
                  </p>
                  <LiveMap
                    incidentLat={selected.lat ? Number(selected.lat) : null}
                    incidentLng={selected.lng ? Number(selected.lng) : null}
                    incidentId={selected.id}
                    incidentType={selected.incident_type}
                    responderActive={selected.status === 'en_route'}
                    height="280px"
                  />
                </div>

                {/* ── Photo ── */}
                {selected.media_url && (
                  <div className="ad-modal-sec">
                    <p className="ad-modal-label">
                      <Icon name="photo" size={13} color="#8fa8c0" /> Photo Evidence
                    </p>
                    <img
                      src={selected.media_url}
                      alt="evidence"
                      className="ad-modal-photo"
                    />
                  </div>
                )}

                {/* ── Timestamps ── */}
                <div className="ad-modal-sec ad-modal-times">
                  <span>Submitted: {formatDate(selected.created_at)}</span>
                  <span>Updated: {formatDate(selected.updated_at)}</span>
                </div>

                {/* ── Responder note ── */}
                <div className="ad-modal-sec">
                  <p className="ad-modal-label">
                    <Icon name="note" size={13} color="#8fa8c0" /> Responder Note
                  </p>
                  {selected.responder_note && (
                    <p className="ad-modal-note-existing">{selected.responder_note}</p>
                  )}
                  <textarea
                    className="ad-modal-note-input"
                    rows={3}
                    placeholder="Add or update note…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                  />
                  <button
                    className="ad-modal-save-btn"
                    onClick={saveNote}
                    disabled={savingNote || !noteText.trim()}
                  >
                    {savingNote ? 'Saving…' : 'Save Note'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── CSS ────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:#eff6ff; }
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

.ad-shell { min-height:100vh; width:100%; background:#eff6ff; font-family:'DM Sans',system-ui,sans-serif; }

/* ── Header ── */
.ad-header { background:#0f2d5e; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(15,45,94,0.3); }
.ad-header-inner { max-width:1100px; margin:0 auto; padding:0 16px; height:60px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
.ad-logo { display:flex; align-items:center; gap:9px; min-width:0; flex-shrink:1; overflow:hidden; }
.ad-logo-circle { width:34px; height:34px; background:#1a56db; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ad-logo-title { font-size:13px; font-weight:800; letter-spacing:1.5px; color:#fff; line-height:1.1; white-space:nowrap; }
.ad-logo-sub { font-size:9px; color:rgba(255,255,255,0.45); white-space:nowrap; }
.ad-header-right { display:flex; align-items:center; gap:4px; flex-shrink:0; }
.ad-user-name { font-size:11px; color:rgba(255,255,255,0.65); max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:4px; }
.ad-icon-btn { position:relative; background:none; border:none; cursor:pointer; padding:7px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; flex-shrink:0; }
.ad-icon-btn:hover { background:rgba(255,255,255,0.1); }
.ad-icon-btn.spinning svg { animation:ad-spin 1s linear infinite; }
@keyframes ad-spin { to { transform:rotate(360deg); } }
.ad-bell-wrap { position:relative; }
.ad-bell-badge { position:absolute; top:2px; right:2px; min-width:16px; height:16px; background:#e8001d; border-radius:8px; font-size:9px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; padding:0 3px; border:2px solid #0f2d5e; }

/* Live broadcast indicator in header */
.ad-live-pill { display:flex; align-items:center; gap:5px; background:rgba(220,38,38,0.2); border:1px solid rgba(220,38,38,0.4); border-radius:20px; padding:4px 10px; font-size:10px; font-weight:700; color:#fca5a5; letter-spacing:1px; }
.ad-live-dot { width:7px; height:7px; background:#ef4444; border-radius:50%; animation:ad-blink 1s infinite; flex-shrink:0; }
@keyframes ad-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* ── Notif panel ── */
.ad-notif-panel { background:#fff; border-bottom:1px solid #e2eaf6; box-shadow:0 4px 24px rgba(15,45,94,0.1); max-height:320px; overflow-y:auto; }
.ad-notif-inner { max-width:1100px; margin:0 auto; padding:12px 16px; }
.ad-notif-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.ad-notif-title { font-size:14px; font-weight:700; color:#0f1b2d; }
.ad-icon-btn-sm { background:none; border:none; cursor:pointer; padding:4px; border-radius:6px; display:flex; align-items:center; }
.ad-icon-btn-sm:hover { background:#f1f5f9; }
.ad-notif-empty { font-size:13px; color:#8fa8c0; padding:8px 0; }
.ad-notif-item { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid #f1f5f9; }
.ad-notif-item.unread .ad-notif-dot { background:#1a56db; }
.ad-notif-dot { width:8px; height:8px; border-radius:50%; background:#e2eaf6; flex-shrink:0; margin-top:4px; }
.ad-notif-msg { font-size:13px; color:#0f1b2d; line-height:1.4; }
.ad-notif-time { font-size:11px; color:#8fa8c0; margin-top:2px; font-family:'DM Mono',monospace; }

/* ── Body ── */
.ad-body { max-width:1100px; margin:0 auto; padding:16px 12px 60px; }

/* ── Stats ── */
.ad-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
.ad-stat-card { background:#fff; border:1px solid #e2eaf6; border-radius:12px; padding:14px 10px; text-align:center; box-shadow:0 1px 4px rgba(15,45,94,0.06); }
.ad-stat-val { font-size:26px; font-weight:700; line-height:1; margin-bottom:4px; }
.ad-stat-label { font-size:10px; color:#6b7a8d; font-weight:500; letter-spacing:0.3px; }

/* ── Filters ── */
.ad-filters-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; margin-bottom:12px; }
.ad-filters { display:flex; align-items:center; gap:6px; width:max-content; min-width:100%; padding-bottom:4px; }
.ad-filter-btn { background:#fff; border:1.5px solid #e2eaf6; border-radius:20px; padding:6px 14px; font-family:inherit; font-size:12px; font-weight:500; color:#6b7a8d; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:5px; white-space:nowrap; flex-shrink:0; }
.ad-filter-btn:hover { border-color:#1a56db; color:#1a56db; }
.ad-filter-btn.active { background:#1a56db; border-color:#1a56db; color:#fff; }
.ad-filter-count { background:rgba(255,255,255,0.25); border-radius:10px; padding:1px 6px; font-size:10px; }
.ad-filter-btn:not(.active) .ad-filter-count { background:#f1f5f9; color:#6b7a8d; }

/* ── Loading / empty ── */
.ad-loading { display:flex; align-items:center; justify-content:center; gap:10px; padding:60px; color:#6b7a8d; font-size:14px; }
.ad-empty { text-align:center; padding:60px; color:#8fa8c0; font-size:14px; }
.ad-spinner { width:20px; height:20px; border:2px solid #dbeafe; border-top-color:#1a56db; border-radius:50%; display:inline-block; animation:ad-spin 0.7s linear infinite; }
.ad-spinner-xs { width:10px; height:10px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; display:inline-block; animation:ad-spin 0.7s linear infinite; }

/* ── Cards ── */
.ad-list { display:flex; flex-direction:column; gap:10px; }
.ad-card { background:#fff; border:1.5px solid #e2eaf6; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.15s; box-shadow:0 1px 4px rgba(15,45,94,0.05); }
.ad-card:hover { border-color:#bfdbfe; box-shadow:0 4px 16px rgba(26,86,219,0.1); transform:translateY(-1px); }
.ad-card.selected { border-color:#1a56db; box-shadow:0 4px 16px rgba(26,86,219,0.15); }
.ad-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; gap:8px; }
.ad-card-left { display:flex; align-items:center; gap:10px; min-width:0; }
.ad-type-icon { font-size:22px; flex-shrink:0; }
.ad-card-type { font-size:14px; font-weight:700; color:#0f1b2d; }
.ad-card-reporter { font-size:11px; color:#8fa8c0; margin-top:2px; font-family:'DM Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ad-status-badge { font-size:11px; font-weight:600; padding:4px 8px; border-radius:20px; border:1px solid; white-space:nowrap; flex-shrink:0; }
.ad-card-desc { font-size:13px; color:#4a637a; line-height:1.5; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ad-card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:wrap; gap:6px; }
.ad-card-time { font-size:11px; color:#8fa8c0; font-family:'DM Mono',monospace; }
.ad-map-link { display:flex; align-items:center; gap:4px; font-size:12px; color:#1a56db; text-decoration:none; font-weight:500; }
.ad-map-link:hover { text-decoration:underline; }
.ad-qs-row { display:flex; gap:5px; overflow-x:auto; -webkit-overflow-scrolling:touch; padding-bottom:2px; }
.ad-qs-btn { flex-shrink:0; padding:5px 10px; background:#f8faff; border:1.5px solid #e2eaf6; border-radius:6px; font-family:inherit; font-size:11px; font-weight:600; color:#6b7a8d; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:4px; white-space:nowrap; }
.ad-qs-btn:hover:not(:disabled) { border-color:#1a56db; color:#1a56db; }
.ad-qs-btn:disabled { opacity:0.6; cursor:default; }

/* ── Modal ── */
.ad-overlay { position:fixed; inset:0; background:rgba(15,27,45,0.55); z-index:200; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(2px); }
.ad-modal { background:#fff; border-radius:20px 20px 0 0; width:100%; max-width:640px; max-height:92vh; overflow-y:auto; animation:ad-slideUp 0.3s ease; }
@keyframes ad-slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
.ad-modal-head { display:flex; align-items:flex-start; justify-content:space-between; padding:18px 18px 14px; gap:12px; position:sticky; top:0; background:#fff; border-bottom:1px solid #f1f5f9; z-index:1; }
.ad-modal-type { font-size:17px; font-weight:700; color:#0f1b2d; }
.ad-modal-reporter { font-size:12px; color:#8fa8c0; margin-top:3px; font-family:'DM Mono',monospace; word-break:break-all; }
.ad-modal-body { padding:16px 18px 32px; display:flex; flex-direction:column; gap:16px; }
.ad-modal-sec { display:flex; flex-direction:column; gap:6px; }
.ad-modal-label { font-size:11px; font-weight:700; color:#8fa8c0; letter-spacing:1px; text-transform:uppercase; display:flex; align-items:center; gap:5px; }
.ad-modal-text { font-size:14px; color:#0f1b2d; line-height:1.6; }
.ad-modal-photo { width:100%; border-radius:8px; max-height:220px; object-fit:cover; border:1px solid #e2eaf6; }
.ad-modal-times { flex-direction:row; gap:12px; font-size:11px; color:#8fa8c0; font-family:'DM Mono',monospace; flex-wrap:wrap; }
.ad-modal-note-existing { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px 12px; font-size:13px; color:#92400e; line-height:1.5; }
.ad-modal-note-input { width:100%; padding:10px 12px; font-family:inherit; font-size:13px; border:1.5px solid #e2eaf6; border-radius:8px; outline:none; resize:none; color:#0f1b2d; transition:border-color 0.15s; }
.ad-modal-note-input:focus { border-color:#1a56db; }
.ad-modal-save-btn { align-self:flex-start; padding:10px 22px; background:#1a56db; color:#fff; border:none; border-radius:8px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:background 0.15s; }
.ad-modal-save-btn:hover:not(:disabled) { background:#0f2d5e; }
.ad-modal-save-btn:disabled { opacity:0.5; cursor:default; }
.ad-modal-statuses { display:flex; gap:6px; flex-wrap:wrap; }
.ad-ms-btn { padding:7px 12px; background:#f8faff; border:1.5px solid #e2eaf6; border-radius:6px; font-family:inherit; font-size:12px; font-weight:600; color:#6b7a8d; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; gap:5px; }
.ad-ms-btn:hover:not(:disabled) { border-color:#1a56db; color:#1a56db; }
.ad-ms-btn:disabled { opacity:0.6; cursor:default; }

/* ── Broadcast button ── */
.ad-broadcast-wrap { display:flex; flex-direction:column; gap:6px; margin-top:10px; padding-top:10px; border-top:1px solid #f1f5f9; }
.ad-broadcast-btn { display:flex; align-items:center; gap:8px; padding:11px 18px; border:none; border-radius:9px; font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.15s; }
.ad-broadcast-start { background:#1a56db; color:#fff; box-shadow:0 3px 12px rgba(26,86,219,0.3); }
.ad-broadcast-start:hover { background:#0f2d5e; transform:translateY(-1px); }
.ad-broadcast-stop { background:#dc2626; color:#fff; box-shadow:0 3px 12px rgba(220,38,38,0.3); }
.ad-broadcast-stop:hover { background:#991b1b; }
.ad-broadcast-dot { width:8px; height:8px; background:#fff; border-radius:50%; animation:ad-blink 0.8s infinite; flex-shrink:0; }
.ad-broadcast-status { font-size:11px; color:#16a34a; font-family:'DM Mono',monospace; font-weight:600; }

/* ══ RESPONSIVE ══ */
@media (max-width:480px) {
  .ad-logo-sub    { display:none; }
  .ad-user-name   { display:none; }
  .ad-logo-title  { font-size:11px; letter-spacing:1px; }
  .ad-stats       { grid-template-columns:repeat(2,1fr); gap:6px; }
  .ad-stat-val    { font-size:22px; }
  .ad-stat-card   { padding:12px 8px; }
  .ad-body        { padding:12px 10px 80px; }
  .ad-card        { padding:12px; }
  .ad-modal       { border-radius:16px 16px 0 0; }
  .ad-modal-head  { padding:14px 14px 12px; }
  .ad-modal-body  { padding:14px 14px 28px; gap:14px; }
  .ad-live-pill   { display:none; }
}

@media (min-width:481px) and (max-width:767px) {
  .ad-stats { grid-template-columns:repeat(2,1fr); }
  .ad-stat-val { font-size:24px; }
}

@media (min-width:768px) {
  .ad-body { padding:20px 20px 60px; }
  .ad-overlay { align-items:center; }
  .ad-modal { border-radius:16px; max-height:85vh; }
  @keyframes ad-slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .ad-filters-wrap { overflow-x:visible; }
  .ad-filters { width:auto; min-width:auto; }
  .ad-stat-val { font-size:28px; }
}

@media (min-width:1024px) {
  .ad-logo-title { font-size:14px; }
  .ad-user-name  { display:block; }
}

@supports (padding-bottom:env(safe-area-inset-bottom)) {
  .ad-modal-body { padding-bottom:calc(32px + env(safe-area-inset-bottom)); }
  .ad-body       { padding-bottom:calc(60px + env(safe-area-inset-bottom)); }
}
`;
