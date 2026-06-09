// ============================================================
//  LiveMap.jsx — LIGTAS LILIW
//  Leaflet.js map showing:
//    • Incident location pin (red)
//    • Live responder pin (blue, moves every 5s like Grab/Angkas)
//    • Auto-fits both pins in view
//
//  Install:  npm install leaflet react-leaflet
//  Add to index.html <head>:
//    <link rel="stylesheet"
//      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Dynamically import Leaflet to avoid SSR issues
let L = null;

export default function LiveMap({
  incidentLat,    // number — incident GPS lat
  incidentLng,    // number — incident GPS lng
  incidentId,     // string (UUID) — to poll responder location
  incidentType,   // string — for marker label
  responderActive = false, // bool — show responder pin?
  height = '320px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const incidentMarker  = useRef(null);
  const responderMarker = useRef(null);
  const responderLine   = useRef(null);
  const pollTimer       = useRef(null);

  const [responderCoords, setResponderCoords] = useState(null);
  const [responderStatus, setResponderStatus] = useState('idle');
  // idle | tracking | no_signal

  // ── Initialize Leaflet map ──────────────────────────────────
  useEffect(() => {
    if (!incidentLat || !incidentLng) return;
    if (mapInstanceRef.current) return; // already initialized

    const initMap = async () => {
      // Dynamic import so Vite doesn't try to SSR it
      L = (await import('leaflet')).default;

      // Fix broken default icon paths in Vite builds
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([incidentLat, incidentLng], 16);

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Attribution (small, bottom-right)
      L.control.attribution({ prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a>')
        .addTo(map);

      // ── Incident marker (red pulse) ──
      const incidentIcon = L.divIcon({
        className: '',
        html: `
          <div class="lm-incident-pin">
            <div class="lm-pin-pulse"></div>
            <div class="lm-pin-dot"></div>
            <div class="lm-pin-label">${incidentType ?? 'Emergency'}</div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      incidentMarker.current = L.marker([incidentLat, incidentLng], {
        icon: incidentIcon,
        zIndexOffset: 100,
      }).addTo(map)
        .bindPopup(`
          <b>${incidentType ?? 'Emergency'}</b><br>
          <span style="font-size:11px;color:#666">
            ${incidentLat.toFixed(5)}, ${incidentLng.toFixed(5)}
          </span>`)
        .openPopup();

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        incidentMarker.current  = null;
        responderMarker.current = null;
        responderLine.current   = null;
      }
    };
  }, [incidentLat, incidentLng, incidentType]);

  // ── Poll responder location ─────────────────────────────────
  const fetchResponderLocation = useCallback(async () => {
    if (!incidentId || !L) return;
    try {
      const result = await db.execute(sql`
        SELECT lat, lng, updated_at
        FROM   responder_locations
        WHERE  incident_id = ${incidentId}
        AND    is_active = TRUE
        ORDER  BY updated_at DESC
        LIMIT  1
      `);

      if (!result.rows?.length) {
        setResponderStatus('no_signal');
        return;
      }

      const { lat, lng, updated_at } = result.rows[0];

      // Check if location is stale (> 30 seconds old)
      const age = Date.now() - new Date(updated_at).getTime();
      if (age > 30000) {
        setResponderStatus('no_signal');
        return;
      }

      setResponderCoords({ lat, lng });
      setResponderStatus('tracking');
      updateResponderPin(lat, lng);
    } catch (err) {
      console.error('fetchResponderLocation:', err);
    }
  }, [incidentId]);

  const updateResponderPin = (lat, lng) => {
    if (!mapInstanceRef.current || !L) return;

    const responderIcon = L.divIcon({
      className: '',
      html: `
        <div class="lm-responder-pin">
          <div class="lm-resp-outer"></div>
          <div class="lm-resp-inner"></div>
          <div class="lm-resp-label">Responder</div>
        </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (responderMarker.current) {
      // Smoothly move existing pin
      responderMarker.current.setLatLng([lat, lng]);
    } else {
      // Create new pin
      responderMarker.current = L.marker([lat, lng], {
        icon: responderIcon,
        zIndexOffset: 200,
      }).addTo(mapInstanceRef.current)
        .bindPopup('<b>Responder</b><br><span style="font-size:11px;color:#666">En route to incident</span>');

      // Draw dashed line between responder and incident
      if (incidentLat && incidentLng) {
        if (responderLine.current) {
          mapInstanceRef.current.removeLayer(responderLine.current);
        }
        responderLine.current = L.polyline(
          [[lat, lng], [incidentLat, incidentLng]],
          { color: '#1a56db', weight: 2, dashArray: '6 8', opacity: 0.6 }
        ).addTo(mapInstanceRef.current);
      }
    }

    // Update the dashed line
    if (responderLine.current && incidentLat && incidentLng) {
      responderLine.current.setLatLngs([[lat, lng], [incidentLat, incidentLng]]);
    }

    // Fit map to show both pins
    if (incidentLat && incidentLng) {
      const bounds = L.latLngBounds(
        [lat, lng],
        [incidentLat, incidentLng]
      ).pad(0.3);
      mapInstanceRef.current.fitBounds(bounds, { maxZoom: 17 });
    }
  };

  // Start/stop polling based on responderActive
  useEffect(() => {
    if (responderActive && incidentId) {
      fetchResponderLocation(); // immediate first fetch
      pollTimer.current = setInterval(fetchResponderLocation, 5000);
    } else {
      clearInterval(pollTimer.current);
      // Remove responder pin if tracking stops
      if (responderMarker.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(responderMarker.current);
        responderMarker.current = null;
      }
      if (responderLine.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(responderLine.current);
        responderLine.current = null;
      }
      setResponderStatus('idle');
    }
    return () => clearInterval(pollTimer.current);
  }, [responderActive, incidentId, fetchResponderLocation]);

  // ── No GPS coords ───────────────────────────────────────────
  if (!incidentLat || !incidentLng) {
    return (
      <div style={noGpsStyle}>
        <span style={{ fontSize: 28 }}>📍</span>
        <p style={{ margin: 0, fontSize: 13, color: '#8fa8c0', textAlign: 'center' }}>
          Walang GPS coordinates ang ulat na ito.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{mapCss}</style>
      <div className="lm-wrap" style={{ height }}>

        {/* Leaflet map container */}
        <div ref={mapContainerRef} className="lm-container" />

        {/* Status bar */}
        <div className="lm-status-bar">
          {responderActive && responderStatus === 'tracking' && responderCoords && (
            <div className="lm-status lm-tracking">
              <span className="lm-live-dot" />
              Responder en route · updating live
            </div>
          )}
          {responderActive && responderStatus === 'no_signal' && (
            <div className="lm-status lm-no-signal">
              <span>⚠</span> Responder signal lost
            </div>
          )}
          {!responderActive && (
            <div className="lm-status lm-waiting">
              <span>📍</span> Waiting for responder assignment
            </div>
          )}
        </div>

        {/* Open in Google Maps link */}
        <a
          className="lm-gmaps-btn"
          href={`https://maps.google.com/?q=${incidentLat},${incidentLng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps ↗
        </a>

      </div>
    </>
  );
}

// ── Responder broadcaster (used by admin/responder) ────────────
// Import and use this hook on the admin side when status = en_route
export function useResponderBroadcast({ incidentId, responderId, active }) {
  const broadcastTimer = useRef(null);

  const broadcast = useCallback(async () => {
    if (!incidentId || !responderId || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await db.execute(sql`
            INSERT INTO responder_locations
              (incident_id, responder_id, lat, lng, is_active, updated_at)
            VALUES
              (${incidentId}, ${responderId}, ${pos.coords.latitude}, ${pos.coords.longitude}, TRUE, NOW())
            ON CONFLICT (incident_id, responder_id)
            WHERE is_active = TRUE
            DO UPDATE SET
              lat        = EXCLUDED.lat,
              lng        = EXCLUDED.lng,
              updated_at = NOW()
          `);
        } catch (err) {
          console.error('broadcast error:', err);
        }
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [incidentId, responderId]);

  useEffect(() => {
    if (active && incidentId && responderId) {
      broadcast(); // immediate
      broadcastTimer.current = setInterval(broadcast, 5000);
    } else {
      clearInterval(broadcastTimer.current);
      // Mark location as inactive when done
      if (incidentId && responderId) {
        db.execute(sql`
          UPDATE responder_locations
          SET    is_active = FALSE
          WHERE  incident_id = ${incidentId}
          AND    responder_id = ${responderId}
        `).catch(console.error);
      }
    }
    return () => clearInterval(broadcastTimer.current);
  }, [active, incidentId, responderId, broadcast]);
}

// ── Styles ─────────────────────────────────────────────────────
const noGpsStyle = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '32px 16px',
  background: '#f8faff', borderRadius: 10,
  border: '1.5px dashed #bcd0f0',
};

const mapCss = `
  .lm-wrap {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid #e2eaf6;
    box-shadow: 0 2px 12px rgba(15,45,94,0.08);
    background: #e8f0fe;
  }

  .lm-container {
    width: 100%;
    height: 100%;
  }

  /* ── Incident pin (red pulse) ── */
  .lm-incident-pin {
    position: relative;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
  }

  .lm-pin-pulse {
    position: absolute;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.25);
    animation: lm-pulse 1.8s ease-out infinite;
  }

  .lm-pin-dot {
    position: relative;
    width: 18px; height: 18px;
    background: #dc2626;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(220,38,38,0.5);
    z-index: 1;
  }

  .lm-pin-label {
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    font-family: 'DM Sans', system-ui, sans-serif;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  @keyframes lm-pulse {
    0%   { transform: scale(0.4); opacity: 0.8; }
    100% { transform: scale(1.8); opacity: 0; }
  }

  /* ── Responder pin (blue moving) ── */
  .lm-responder-pin {
    position: relative;
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
  }

  .lm-resp-outer {
    position: absolute;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(26, 86, 219, 0.2);
    animation: lm-resp-pulse 2s ease-out infinite;
  }

  .lm-resp-inner {
    position: relative;
    width: 22px; height: 22px;
    background: #1a56db;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 10px rgba(26,86,219,0.55);
    z-index: 1;
    animation: lm-move-indicator 0.8s ease-in-out infinite alternate;
  }

  .lm-resp-label {
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a56db;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    font-family: 'DM Sans', system-ui, sans-serif;
    padding: 2px 7px;
    border-radius: 4px;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  @keyframes lm-resp-pulse {
    0%   { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  @keyframes lm-move-indicator {
    from { box-shadow: 0 2px 10px rgba(26,86,219,0.55); }
    to   { box-shadow: 0 2px 20px rgba(26,86,219,0.9); }
  }

  /* ── Status bar (bottom overlay) ── */
  .lm-status-bar {
    position: absolute;
    bottom: 36px; left: 8px;
    z-index: 1000;
  }

  .lm-status {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
  }

  .lm-tracking {
    background: rgba(15,45,94,0.85);
    color: #93c5fd;
    border: 1px solid rgba(147,197,253,0.3);
  }

  .lm-no-signal {
    background: rgba(220,38,38,0.85);
    color: #fff;
  }

  .lm-waiting {
    background: rgba(255,255,255,0.9);
    color: #6b7a8d;
    border: 1px solid #e2eaf6;
  }

  .lm-live-dot {
    width: 7px; height: 7px;
    background: #4ade80;
    border-radius: 50%;
    animation: lm-blink 1s infinite;
  }

  @keyframes lm-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

  /* ── Google Maps link ── */
  .lm-gmaps-btn {
    position: absolute;
    bottom: 8px; right: 8px;
    z-index: 1000;
    background: rgba(255,255,255,0.92);
    color: #1a56db;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 6px;
    text-decoration: none;
    border: 1px solid #dbeafe;
    backdrop-filter: blur(4px);
    transition: background 0.15s;
  }

  .lm-gmaps-btn:hover { background: #eff6ff; }

  /* Leaflet overrides to match our UI */
  .leaflet-popup-content-wrapper {
    border-radius: 10px !important;
    font-family: 'DM Sans', system-ui, sans-serif !important;
    box-shadow: 0 4px 24px rgba(15,45,94,0.15) !important;
  }

  .leaflet-popup-content {
    font-size: 13px !important;
    margin: 10px 14px !important;
  }

  .leaflet-control-zoom {
    border: 1px solid #e2eaf6 !important;
    border-radius: 8px !important;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(15,45,94,0.1) !important;
  }

  .leaflet-control-zoom-in,
  .leaflet-control-zoom-out {
    font-family: 'DM Sans', system-ui, sans-serif !important;
    color: #1a56db !important;
    background: #fff !important;
    border: none !important;
  }

  .leaflet-control-zoom-in:hover,
  .leaflet-control-zoom-out:hover {
    background: #eff6ff !important;
  }
`;
