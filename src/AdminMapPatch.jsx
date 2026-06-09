// ============================================================
//  AdminDashboard — Map + Responder Broadcast patch
//
//  Add these changes to your existing AdminDashboard.jsx:
//
//  1. Add this import at the top:
//     import LiveMap, { useResponderBroadcast } from './LiveMap';
//
//  2. Add this state inside AdminDashboard():
//     const [broadcasting, setBroadcasting] = useState(null);
//     // null | { incidentId, responderId }
//
//  3. Add this hook call inside AdminDashboard():
//     useResponderBroadcast({
//       incidentId:   broadcasting?.incidentId  ?? null,
//       responderId:  broadcasting?.responderId ?? null,
//       active:       !!broadcasting,
//     });
//
//  4. Replace the GPS Location section inside the detail modal
//     with the block below.
//
//  5. Add the "Respond" button to the status section in the modal.
// ============================================================

// ── REPLACE the GPS Location section in ad-modal-body with this:

/*
{selected.lat ? (
  <div className="ad-modal-sec">
    <p className="ad-modal-label">GPS Location + Live Map</p>
    <LiveMap
      incidentLat={selected.lat}
      incidentLng={selected.lng}
      incidentId={selected.id}
      incidentType={selected.incident_type}
      responderActive={selected.status === 'en_route'}
      height="280px"
    />
  </div>
) : (
  <div className="ad-modal-sec">
    <p className="ad-modal-label">GPS Location</p>
    <p style={{ fontSize:13, color:'#8fa8c0' }}>Walang GPS coordinates.</p>
  </div>
)}
*/

// ── ADD this inside the status section of the modal,
//    after the status buttons row:

/*
{selected.status === 'en_route' && (
  <div style={{ marginTop: 8 }}>
    {broadcasting?.incidentId === selected.id ? (
      <button
        className="ad-modal-save-btn"
        style={{ background: '#dc2626' }}
        onClick={() => setBroadcasting(null)}
      >
        ⏹ Stop Broadcasting Location
      </button>
    ) : (
      <button
        className="ad-modal-save-btn"
        onClick={() => setBroadcasting({
          incidentId:  selected.id,
          responderId: user.id,
        })}
      >
        📍 Start Broadcasting My Location
      </button>
    )}
    {broadcasting?.incidentId === selected.id && (
      <p style={{
        fontSize: 11, color: '#16a34a', marginTop: 6,
        fontFamily: 'DM Mono, monospace',
      }}>
        ● Broadcasting live GPS every 5 seconds…
      </p>
    )}
  </div>
)}
*/
