// ============================================================
//  IncidentReporter.jsx — Member report form
//  Mobile + Desktop responsive · Blue theme · LIGTAS LILIW
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { useAuth } from './AuthContext';

const INCIDENT_TYPES = [
  { value: 'Fire',     label: 'Sunog',     icon: 'fire',     color: '#e85d2f' },
  { value: 'Medical',  label: 'Medikal',   icon: 'medical',  color: '#e82f2f' },
  { value: 'Crime',    label: 'Krimen',    icon: 'crime',    color: '#7c3aed' },
  { value: 'Flood',    label: 'Baha',      icon: 'flood',    color: '#0369a1' },
  { value: 'Accident', label: 'Aksidente', icon: 'accident', color: '#d97706' },
  { value: 'General',  label: 'Iba Pa',    icon: 'general',  color: '#0f5499' },
];

const STATUS_STEPS = [
  { label: 'Submitted',           key: 'submitted'  },
  { label: 'Responder Notified',  key: 'notified'   },
  { label: 'En Route',            key: 'en_route'   },
  { label: 'Resolved',            key: 'resolved'   },
];

// ── SVG Icon component ────────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const paths = {
    fire:     <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />,
    medical:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
    crime:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Z" />,
    flood:    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />,
    accident: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />,
    general:  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />,
    pin:      <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></>,
    photo:    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />,
    camera:   <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />,
    check:    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />,
    warning:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />,
    shield:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Z" />,
    close:    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />,
    plus:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    logout:   <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />,
    list:     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} xmlns="http://www.w3.org/2000/svg">
      {paths[name]}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────
export default function IncidentReporter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab: 'report' | 'history'
  const [activeTab, setActiveTab]       = useState('report');

  // Form state
  const [step, setStep]                 = useState('form'); // 'form' | 'success'
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription]  = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [locationStatus, setLocationStatus] = useState('idle');
  const [coords, setCoords]             = useState(null);
  const [currentStatus, setCurrentStatus] = useState(0);
  const [reportId, setReportId]         = useState(null);

  // History state
  const [myReports, setMyReports]       = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);

  // ── Fetch my reports ────────────────────────────────────────
  const fetchMyReports = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const result = await db.execute(sql`
        SELECT id, incident_type, description, status,
               lat, lng, created_at, updated_at, responder_note
        FROM   incidents
        WHERE  user_id = ${user.id}
        ORDER  BY created_at DESC
      `);
      setMyReports(result.rows ?? []);
    } catch (err) {
      console.error('fetchMyReports error:', err);
      setHistoryError('Hindi ma-load ang mga ulat. Subukan ulit.');
    }
    setHistoryLoading(false);
  }, [user?.id]);

  // Load history when tab switches
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') fetchMyReports();
  };

  // ── GPS ────────────────────────────────────────────────────
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('got');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Photo ──────────────────────────────────────────────────
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');
    if (!selectedType)       { setSubmitError('Pumili ng uri ng emergency.'); return; }
    if (!description.trim()) { setSubmitError('Ilarawan ang sitwasyon.'); return; }

    setLoading(true);

    // Get GPS if not yet captured
    let lat = coords?.lat ?? null;
    let lng = coords?.lng ?? null;
    if (!coords && navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true, timeout: 8000,
          })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setCoords({ lat, lng });
      } catch (_) { /* GPS failed silently — still submit */ }
    }

    try {
      console.log('Submitting incident to Neon:', {
        user_id: user?.id, lat, lng,
        incident_type: selectedType,
        description,
      });

      const result = await db.execute(sql`
        INSERT INTO incidents (user_id, lat, lng, incident_type, description, status)
        VALUES (
          ${user?.id ?? null},
          ${lat ?? null},
          ${lng ?? null},
          ${selectedType},
          ${description},
          'pending'
        )
        RETURNING id, incident_type, created_at
      `);

      console.log('Insert result:', result);

      const newId = result.rows?.[0]?.id
        ?? result.rows?.[0]?.['id']
        ?? null;

      setReportId(newId ?? `TMP-${Date.now()}`);
      setStep('success');
      setCurrentStatus(0);
      setTimeout(() => setCurrentStatus(1), 2200);

    } catch (err) {
      console.error('Submit error full details:', err);
      setSubmitError(
        `Hindi naisumite: ${err?.message ?? 'Unknown error'}. ` +
        `Tingnan ang console para sa detalye.`
      );
    }

    setLoading(false);
  };

  // ── Reset form ─────────────────────────────────────────────
  const handleReset = () => {
    setStep('form');
    setSelectedType(null);
    setDescription('');
    setMediaPreview(null);
    setCoords(null);
    setLocationStatus('idle');
    setCurrentStatus(0);
    setReportId(null);
    setSubmitError('');
  };

  // ════════════════════════════════════════════════════════════
  //  SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════
  if (step === 'success') {
    return (
      <>
        <style>{css}</style>
        <div className="ir-shell">
          <SimpleHeader user={user} logout={logout} onBack={() => navigate('/dashboard')} Icon={Icon} />
          <main className="ir-content">
            <div className="ir-success-card">
              <div className="ir-success-anim">
                <div className="ir-success-ring r1" />
                <div className="ir-success-ring r2" />
                <div className="ir-checkmark">
                  <Icon name="check" size={28} color="#fff" />
                </div>
              </div>

              <h2 className="ir-success-title">Naisumite na!</h2>
              <p className="ir-success-id">
                Report #{typeof reportId === 'number'
                  ? String(reportId).padStart(6, '0')
                  : reportId}
              </p>
              <p className="ir-success-note">
                Naitala na ang iyong emergency. Tinutukuyan na ang mga responder.
              </p>

              {/* Status tracker */}
              <div className="ir-track">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s.key} className="ir-track-item">
                    <div className={`ir-track-dot ${i <= currentStatus ? 'done' : ''} ${i === currentStatus ? 'active' : ''}`}>
                      {i < currentStatus
                        ? <Icon name="check" size={12} color="#fff" />
                        : i === currentStatus
                          ? <span className="ir-pulse-dot" />
                          : <span className="ir-track-num">{i + 1}</span>}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`ir-track-line ${i < currentStatus ? 'done' : ''}`} />
                    )}
                    <span className={`ir-track-label ${i <= currentStatus ? 'done' : ''}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {currentStatus >= 1 && (
                <div className="ir-notif-pill">
                  <Icon name="warning" size={14} color="#1a56db" />
                  <span>Natanggap na ng responder ang iyong ulat</span>
                </div>
              )}

              <div className="ir-success-actions">
                <button className="ir-ghost-btn" onClick={handleReset}>
                  <Icon name="plus" size={16} color="#1a56db" /> Bagong Ulat
                </button>
                <button className="ir-ghost-btn ir-history-btn"
                  onClick={() => navigate('/dashboard')}>
                  <Icon name="list" size={16} color="#6b7a8d" /> Aking mga Ulat
                </button>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  HISTORY TAB
  // ════════════════════════════════════════════════════════════
  if (activeTab === 'history') {
    return (
      <>
        <style>{css}</style>
        <div className="ir-shell">
          <SimpleHeader user={user} logout={logout} onBack={() => navigate('/dashboard')} Icon={Icon} />
          <main className="ir-content">
            <div className="ir-section-head">
              <h3 className="ir-section-title">Aking mga Ulat</h3>
              <button className="ir-refresh-btn" onClick={fetchMyReports} disabled={historyLoading}>
                {historyLoading ? <span className="ir-spinner" /> : '↻ I-refresh'}
              </button>
            </div>

            {historyLoading && (
              <div className="ir-history-loading">
                <span className="ir-spinner" /> Kinukuha ang mga ulat…
              </div>
            )}

            {historyError && (
              <div className="ir-error-box">{historyError}</div>
            )}

            {!historyLoading && myReports.length === 0 && !historyError && (
              <div className="ir-empty">
                <p>Wala ka pang naisumiteng ulat.</p>
                <button className="ir-ghost-btn" onClick={() => handleTabChange('report')}>
                  <Icon name="plus" size={16} color="#1a56db" /> Mag-report ngayon
                </button>
              </div>
            )}

            <div className="ir-report-list">
              {myReports.map(r => (
                <ReportCard key={r.id} report={r} Icon={Icon} />
              ))}
            </div>
          </main>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  REPORT FORM TAB
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <style>{css}</style>
      <div className="ir-shell">
        <SimpleHeader user={user} logout={logout} onBack={() => navigate('/dashboard')} Icon={Icon} />

        <div className="ir-alert-bar">
          <Icon name="warning" size={14} color="#fff" />
          <span>Para sa mga emergency sa Liliw, Laguna lamang</span>
        </div>

        <main className="ir-content">

          {submitError && (
            <div className="ir-error-box">⚠ {submitError}</div>
          )}

          {/* Step 1 — Type */}
          <section className="ir-section">
            <div className="ir-step-head">
              <span className="ir-step-badge">1</span>
              <h3 className="ir-step-title">
                Uri ng Emergency <span className="ir-step-en">Incident Type</span>
              </h3>
            </div>
            <div className="ir-type-grid">
              {INCIDENT_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`ir-type-btn ${selectedType === t.value ? 'sel' : ''}`}
                  style={{ '--tc': t.color }}
                  onClick={() => setSelectedType(t.value)}
                  type="button"
                >
                  <span className="ir-type-ico">
                    <Icon
                      name={t.icon} size={22}
                      color={selectedType === t.value ? '#fff' : t.color}
                    />
                  </span>
                  <span className="ir-type-label">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 — Description */}
          <section className="ir-section">
            <div className="ir-step-head">
              <span className="ir-step-badge">2</span>
              <h3 className="ir-step-title">
                Detalye <span className="ir-step-en">Description</span>
              </h3>
            </div>
            <div className="ir-field">
              <textarea
                className="ir-textarea"
                rows={4} maxLength={500}
                placeholder="Ilarawan ang nangyayari… (Describe the situation)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <span className="ir-char">{description.length}/500</span>
            </div>
          </section>

          {/* Step 3 — GPS */}
          <section className="ir-section">
            <div className="ir-step-head">
              <span className="ir-step-badge">3</span>
              <h3 className="ir-step-title">
                GPS Lokasyon <span className="ir-step-en">Location</span>
              </h3>
            </div>
            <button
              className={`ir-loc-btn ${locationStatus}`}
              onClick={getLocation}
              disabled={locationStatus === 'fetching'}
              type="button"
            >
              {locationStatus === 'idle'     && <><Icon name="pin" size={18} color="#1a56db" /><span>I-capture ang Lokasyon</span></>}
              {locationStatus === 'fetching' && <><span className="ir-spinner" /><span>Kinukuha ang lokasyon…</span></>}
              {locationStatus === 'got'      && <><Icon name="pin" size={18} color="#16a34a" /><span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span></>}
              {locationStatus === 'error'    && <><Icon name="warning" size={18} color="#dc2626" /><span>Hindi nakuha — Subukan ulit</span></>}
            </button>
          </section>

          {/* Step 4 — Photo */}
          <section className="ir-section">
            <div className="ir-step-head">
              <span className="ir-step-badge">4</span>
              <h3 className="ir-step-title">
                Litrato <span className="ir-step-en">Photo (Optional)</span>
              </h3>
            </div>
            <div className="ir-media-row">
              <button className="ir-media-btn"
                onClick={() => fileInputRef.current?.click()} type="button">
                <Icon name="photo" size={18} color="#1a56db" /> Piliin
              </button>
              <button className="ir-media-btn"
                onClick={() => cameraInputRef.current?.click()} type="button">
                <Icon name="camera" size={18} color="#1a56db" /> Kamera
              </button>
              <input ref={fileInputRef} type="file" accept="image/*"
                hidden onChange={handleMediaChange} />
              <input ref={cameraInputRef} type="file" accept="image/*"
                capture="environment" hidden onChange={handleMediaChange} />
            </div>
            {mediaPreview && (
              <div className="ir-preview">
                <img src={mediaPreview} alt="preview" className="ir-preview-img" />
                <button className="ir-remove"
                  onClick={() => setMediaPreview(null)} type="button">
                  <Icon name="close" size={14} color="#fff" />
                </button>
              </div>
            )}
          </section>

          {/* Submit */}
          <button
            className={`ir-submit ${loading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading
              ? <><span className="ir-spinner white" />Nagpapadala…</>
              : <><Icon name="warning" size={20} color="#fff" />Isumite ang Emergency</>
            }
          </button>

          <p className="ir-footer">
            LIGTAS LILIW · Liliw, Laguna · {new Date().getFullYear()}
          </p>
        </main>
      </div>
    </>
  );
}


// ── Simple header with back button ──────────────────────────
function SimpleHeader({ user, logout, onBack, Icon }) {
  return (
    <header className="ir-header">
      <div className="ir-header-inner">
        <div className="ir-logo">
          <button className="ir-back-btn" onClick={onBack} title="Back to Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="ir-logo-circle">
            <Icon name="shield" size={16} color="#fff" />
          </div>
          <div>
            <p className="ir-logo-title">LIGTAS LILIW</p>
            <p className="ir-logo-sub">Mag-report ng Emergency</p>
          </div>
        </div>
        <div className="ir-header-right">
          <span className="ir-user-name">{user?.name}</span>
          <button className="ir-logout-btn" onClick={logout} title="Logout">
            <Icon name="logout" size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Header component ──────────────────────────────────────────
function Header({ user, logout, onTab, activeTab, Icon }) {
  return (
    <header className="ir-header">
      <div className="ir-header-inner">
        <div className="ir-logo">
          <div className="ir-logo-circle">
            <Icon name="shield" size={18} color="#fff" />
          </div>
          <div>
            <p className="ir-logo-title">LIGTAS LILIW</p>
            <p className="ir-logo-sub">Emergency Report</p>
          </div>
        </div>

        <div className="ir-header-tabs">
          <button
            className={`ir-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => onTab('report')}
          >
            <Icon name="warning" size={14}
              color={activeTab === 'report' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <span>Mag-report</span>
          </button>
          <button
            className={`ir-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => onTab('history')}
          >
            <Icon name="list" size={14}
              color={activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <span>Mga Ulat</span>
          </button>
        </div>

        <div className="ir-header-right">
          <span className="ir-user-name">{user?.name}</span>
          <button className="ir-logout-btn" onClick={logout} title="Logout">
            <Icon name="logout" size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Report history card ───────────────────────────────────────
const STATUS_INFO = {
  pending:  { label: 'Pending',           color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  notified: { label: 'Responder Notified', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  en_route: { label: 'En Route',           color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  resolved: { label: 'Resolved',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const TYPE_EMOJI = {
  Fire: '🔥', Medical: '🚑', Crime: '🚨',
  Flood: '🌊', Accident: '💥', General: '⚠️',
};

function ReportCard({ report, Icon }) {
  const st = STATUS_INFO[report.status] ?? STATUS_INFO.pending;
  const date = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <div className="ir-report-card">
      <div className="ir-rc-top">
        <div className="ir-rc-left">
          <span className="ir-rc-emoji">{TYPE_EMOJI[report.incident_type] ?? '⚠️'}</span>
          <div>
            <p className="ir-rc-type">{report.incident_type}</p>
            <p className="ir-rc-id">#{String(report.id).padStart(6, '0')} · {date}</p>
          </div>
        </div>
        <span className="ir-rc-badge"
          style={{ color: st.color, background: st.bg, borderColor: st.border }}>
          {st.label}
        </span>
      </div>

      <p className="ir-rc-desc">{report.description}</p>

      {report.responder_note && (
        <div className="ir-rc-note">
          <span>📋 Responder note:</span> {report.responder_note}
        </div>
      )}

      {report.lat && (
        <a className="ir-rc-map"
          href={`https://maps.google.com/?q=${report.lat},${report.lng}`}
          target="_blank" rel="noopener noreferrer">
          <Icon name="pin" size={13} color="#1a56db" /> View on Map
        </a>
      )}
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; min-height: 100vh; background: #eff6ff; }

.ir-shell { min-height: 100vh; width: 100%; background: #eff6ff; font-family: 'DM Sans', system-ui, sans-serif; display: flex; flex-direction: column; }

/* Header */
.ir-header { background: #0f2d5e; flex-shrink: 0; box-shadow: 0 2px 10px rgba(15,45,94,0.3); }
.ir-header-inner { max-width: 680px; margin: 0 auto; padding: 0 12px; height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ir-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.ir-logo-circle { width: 34px; height: 34px; background: #1a56db; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ir-logo-title { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: #fff; line-height: 1.1; }
.ir-logo-sub { font-size: 9px; color: rgba(255,255,255,0.45); }

/* Header tabs */
.ir-header-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 3px; }
.ir-tab-btn { display: flex; align-items: center; gap: 5px; padding: 6px 10px; border: none; border-radius: 6px; background: transparent; color: rgba(255,255,255,0.6); font-family: inherit; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.ir-tab-btn.active { background: #1a56db; color: #fff; }
.ir-tab-btn:hover:not(.active) { background: rgba(255,255,255,0.1); color: #fff; }

.ir-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ir-user-name { font-size: 11px; color: rgba(255,255,255,0.6); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ir-logout-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 7px; display: flex; align-items: center; }
.ir-logout-btn:hover { background: rgba(255,255,255,0.1); }

/* Alert bar */
.ir-alert-bar { background: #1a56db; display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.9); padding: 7px 16px; }

/* Content */
.ir-content { flex: 1; max-width: 680px; width: 100%; margin: 0 auto; padding: 20px 16px 40px; display: flex; flex-direction: column; gap: 20px; }

/* Error box */
.ir-error-box { background: #fff5f5; border: 1px solid #fca5a5; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #dc2626; font-weight: 500; line-height: 1.5; }

/* Section */
.ir-section { display: flex; flex-direction: column; gap: 10px; }
.ir-section-head { display: flex; align-items: center; justify-content: space-between; }
.ir-section-title { font-size: 16px; font-weight: 700; color: #0f1b2d; }
.ir-refresh-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1.5px solid #e2eaf6; border-radius: 7px; padding: 6px 12px; font-family: inherit; font-size: 12px; font-weight: 600; color: #1a56db; cursor: pointer; transition: all 0.15s; }
.ir-refresh-btn:hover { background: #eff6ff; }

.ir-step-head { display: flex; align-items: center; gap: 9px; }
.ir-step-badge { width: 22px; height: 22px; background: #1a56db; color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ir-step-title { font-size: 14px; font-weight: 600; color: #0f1b2d; }
.ir-step-en { font-size: 12px; font-weight: 400; color: #8fa8c0; margin-left: 4px; }

/* Type grid */
.ir-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ir-type-btn { background: #fff; border: 1.5px solid #e2eaf6; border-radius: 10px; padding: 14px 6px 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.16s; -webkit-tap-highlight-color: transparent; }
.ir-type-btn:active { transform: scale(0.96); }
.ir-type-btn.sel { background: var(--tc); border-color: var(--tc); box-shadow: 0 4px 14px rgba(26,86,219,0.2); }
.ir-type-ico { width: 42px; height: 42px; border-radius: 10px; background: color-mix(in srgb, var(--tc, #1a56db) 12%, transparent); display: flex; align-items: center; justify-content: center; transition: background 0.16s; }
.ir-type-btn.sel .ir-type-ico { background: rgba(255,255,255,0.2); }
.ir-type-label { font-size: 11px; font-weight: 600; color: #0f1b2d; transition: color 0.16s; }
.ir-type-btn.sel .ir-type-label { color: #fff; }

/* Textarea */
.ir-field { position: relative; }
.ir-textarea { width: 100%; background: #fff; border: 1.5px solid #e2eaf6; border-radius: 10px; padding: 12px 14px 28px; font-family: inherit; font-size: 14px; line-height: 1.6; color: #0f1b2d; resize: none; outline: none; transition: border-color 0.15s; -webkit-appearance: none; }
.ir-textarea::placeholder { color: #b0bec9; }
.ir-textarea:focus { border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,0.08); }
.ir-char { position: absolute; bottom: 9px; right: 12px; font-family: 'DM Mono', monospace; font-size: 10px; color: #8fa8c0; }

/* Location */
.ir-loc-btn { width: 100%; background: #fff; border: 1.5px dashed #bcd0f0; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: center; gap: 9px; font-family: inherit; font-size: 14px; font-weight: 500; color: #1a56db; cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
.ir-loc-btn:hover:not(:disabled) { background: #eff6ff; }
.ir-loc-btn:disabled { opacity: 0.7; cursor: default; }
.ir-loc-btn.got { border-style: solid; border-color: #86efac; background: #f0fdf4; color: #16a34a; font-family: 'DM Mono', monospace; font-size: 12px; }
.ir-loc-btn.error { border-style: solid; border-color: #fca5a5; background: #fff5f5; color: #dc2626; }

/* Media */
.ir-media-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ir-media-btn { background: #fff; border: 1.5px solid #e2eaf6; border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; font-size: 13px; font-weight: 500; color: #1a56db; cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
.ir-media-btn:hover { background: #eff6ff; }
.ir-media-btn:active { transform: scale(0.97); }
.ir-preview { position: relative; border-radius: 10px; overflow: hidden; border: 1.5px solid #e2eaf6; }
.ir-preview-img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
.ir-remove { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; background: rgba(15,27,45,0.65); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }

/* Submit */
.ir-submit { width: 100%; background: #1a56db; border: none; border-radius: 12px; padding: 16px; color: #fff; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px; transition: all 0.16s; box-shadow: 0 4px 16px rgba(26,86,219,0.3); -webkit-tap-highlight-color: transparent; margin-top: 4px; }
.ir-submit:hover:not(:disabled) { background: #0f2d5e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,86,219,0.4); }
.ir-submit:active:not(:disabled) { transform: translateY(0); }
.ir-submit.loading { background: #93b4e8; box-shadow: none; cursor: default; }

/* Spinner */
.ir-spinner { width: 16px; height: 16px; border: 2px solid rgba(26,86,219,0.2); border-top-color: #1a56db; border-radius: 50%; display: inline-block; animation: ir-spin 0.7s linear infinite; flex-shrink: 0; }
.ir-spinner.white { border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
@keyframes ir-spin { to { transform: rotate(360deg); } }

.ir-footer { text-align: center; font-family: 'DM Mono', monospace; font-size: 11px; color: #8fa8c0; padding-top: 4px; }

/* Success */
.ir-success-card { background: #fff; border-radius: 16px; padding: 32px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; box-shadow: 0 4px 24px rgba(15,45,94,0.08); border: 1px solid #e2eaf6; animation: ir-slideUp 0.35s ease; }
@keyframes ir-slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.ir-success-anim { position: relative; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.ir-checkmark { width: 52px; height: 52px; background: #1a56db; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; animation: ir-popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes ir-popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.ir-success-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(26,86,219,0.25); animation: ir-expandRing 2s ease-out infinite; }
.ir-success-ring.r1 { width: 60px; height: 60px; animation-delay: 0s; }
.ir-success-ring.r2 { width: 76px; height: 76px; animation-delay: 0.4s; }
@keyframes ir-expandRing { 0% { opacity: 0.6; transform: scale(0.85); } 100% { opacity: 0; transform: scale(1.3); } }
.ir-success-title { font-size: 22px; font-weight: 700; color: #0f1b2d; }
.ir-success-id { font-family: 'DM Mono', monospace; font-size: 14px; color: #1a56db; background: #eff6ff; padding: 4px 14px; border-radius: 20px; border: 1px solid #dbeafe; }
.ir-success-note { font-size: 14px; color: #6b7a8d; text-align: center; line-height: 1.55; max-width: 280px; }
.ir-success-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 100%; margin-top: 4px; }

/* Status track */
.ir-track { width: 100%; display: flex; align-items: flex-start; justify-content: center; padding: 8px 0 4px; }
.ir-track-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; }
.ir-track-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #e2eaf6; background: #fff; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; transition: all 0.35s; }
.ir-track-dot.done { border-color: #1a56db; background: #1a56db; }
.ir-track-dot.active { border-color: #1a56db; background: #fff; box-shadow: 0 0 0 3px rgba(26,86,219,0.15); }
.ir-track-num { font-family: 'DM Mono', monospace; font-size: 10px; color: #8fa8c0; }
.ir-pulse-dot { width: 10px; height: 10px; background: #1a56db; border-radius: 50%; display: block; animation: ir-blink 1s infinite; }
@keyframes ir-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
.ir-track-line { position: absolute; top: 14px; left: 50%; width: 100%; height: 2px; background: #e2eaf6; transition: background 0.35s; }
.ir-track-line.done { background: #1a56db; }
.ir-track-label { font-size: 10px; color: #8fa8c0; text-align: center; line-height: 1.3; padding: 0 2px; transition: color 0.35s; }
.ir-track-label.done { color: #1a56db; font-weight: 600; }
.ir-notif-pill { display: flex; align-items: center; gap: 7px; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 20px; padding: 8px 16px; font-size: 13px; font-weight: 500; color: #1a56db; }

/* Ghost btn */
.ir-ghost-btn { display: flex; align-items: center; gap: 7px; background: transparent; border: 1.5px solid #e2eaf6; border-radius: 8px; padding: 10px 20px; font-family: inherit; font-size: 13px; font-weight: 600; color: #1a56db; cursor: pointer; transition: all 0.15s; }
.ir-ghost-btn:hover { background: #eff6ff; border-color: #dbeafe; }
.ir-history-btn { color: #6b7a8d; }
.ir-history-btn:hover { background: #f8faff; border-color: #e2eaf6; }

/* History */
.ir-history-loading { display: flex; align-items: center; gap: 10px; color: #6b7a8d; font-size: 14px; padding: 24px 0; }
.ir-empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px 0; color: #8fa8c0; font-size: 14px; }
.ir-report-list { display: flex; flex-direction: column; gap: 10px; }

.ir-report-card { background: #fff; border: 1.5px solid #e2eaf6; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 4px rgba(15,45,94,0.05); }
.ir-rc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.ir-rc-left { display: flex; align-items: center; gap: 10px; }
.ir-rc-emoji { font-size: 24px; flex-shrink: 0; }
.ir-rc-type { font-size: 15px; font-weight: 700; color: #0f1b2d; }
.ir-rc-id { font-size: 11px; color: #8fa8c0; margin-top: 2px; font-family: 'DM Mono', monospace; }
.ir-rc-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
.ir-rc-desc { font-size: 13px; color: #4a637a; line-height: 1.5; }
.ir-rc-note { font-size: 12px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; line-height: 1.5; }
.ir-rc-map { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #1a56db; text-decoration: none; font-weight: 500; }
.ir-rc-map:hover { text-decoration: underline; }

/* Responsive */
@media (min-width: 640px) {
  .ir-content { padding: 24px 32px 48px; }
  .ir-type-grid { grid-template-columns: repeat(6, 1fr); }
  .ir-tab-btn span { display: inline; }
}

@media (max-width: 480px) {
  .ir-logo-sub  { display: none; }
  .ir-user-name { display: none; }
  .ir-tab-btn   { padding: 5px 8px; font-size: 11px; }
  .ir-logo-title { font-size: 11px; letter-spacing: 1px; }
}


.ir-back-btn { background:none; border:none; cursor:pointer; padding:5px; border-radius:7px; display:flex; align-items:center; margin-right:2px; -webkit-tap-highlight-color:transparent; }
.ir-back-btn:hover { background:rgba(255,255,255,0.1); }

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .ir-content { padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
}

/* ── Extra mobile fixes ── */
@media (max-width: 360px) {
  .ir-logo-title { font-size: 10px; letter-spacing: 1px; }
  .ir-tab-btn { padding: 4px 6px; font-size: 10px; gap: 3px; }
  .ir-type-grid { grid-template-columns: repeat(2, 1fr); }
  .ir-type-ico  { width: 36px; height: 36px; }
}

@media (max-width: 480px) {
  .ir-header-tabs { gap: 2px; }
  .ir-content { padding: 14px 12px 36px; gap: 16px; }
  .ir-loc-btn { font-size: 13px; }
  .ir-submit  { font-size: 14px; padding: 14px; }
}

@media (min-width: 481px) and (max-width: 639px) {
  .ir-type-grid { grid-template-columns: repeat(3, 1fr); }
}
`;
