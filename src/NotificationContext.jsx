// ============================================================
//  NotificationContext.jsx
//  In-app real-time notifications via polling.
//
//  HOW IT WORKS:
//  - Polls the `notifications` table every 5 seconds
//  - Admin:  gets notified when a new incident is submitted
//  - Member: gets notified when their report status changes
//  - Unread count drives the bell badge
//  - Toast slides in automatically, auto-dismisses after 5s
// ============================================================

import {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
} from 'react';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { useAuth } from './AuthContext';

// ── Context ──────────────────────────────────────────────────

const NotificationContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────

export function NotificationProvider({ children }) {
  const { user, isLoggedIn } = useAuth();

  const [notifications, setNotifications] = useState([]);  // all fetched rows
  const [toasts, setToasts]               = useState([]);  // visible toast queue
  const [unreadCount, setUnreadCount]     = useState(0);

  const lastSeenId   = useRef(0);   // highest notification id we've seen
  const pollInterval = useRef(null);

  // ----------------------------------------------------------
  //  fetchNotifications — called every 5 seconds
  // ----------------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await db.execute(sql`
        SELECT id, incident_id, message, is_read, created_at
        FROM   notifications
        WHERE  user_id = ${user.id}
        ORDER  BY created_at DESC
        LIMIT  50
      `);

      const rows = result.rows ?? [];
      setNotifications(rows);
      setUnreadCount(rows.filter(r => !r.is_read).length);

      // Find any NEW rows (id > lastSeenId) to fire toasts
      const newRows = rows.filter(r => r.id > lastSeenId.current);
      if (newRows.length > 0 && lastSeenId.current !== 0) {
        // Fire a toast for each new notification (max 3 at once)
        newRows.slice(0, 3).forEach(r => fireToast(r));
      }

      // Update the high-water mark
      if (rows.length > 0) {
        lastSeenId.current = Math.max(...rows.map(r => r.id));
      }
    } catch (err) {
      console.error('Notification poll error:', err);
    }
  }, [user?.id]);

  // ----------------------------------------------------------
  //  Start / stop polling when auth state changes
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      clearInterval(pollInterval.current);
      setNotifications([]);
      setToasts([]);
      setUnreadCount(0);
      lastSeenId.current = 0;
      return;
    }

    // Initial fetch — set lastSeenId without firing toasts
    const initialFetch = async () => {
      try {
        const result = await db.execute(sql`
          SELECT id, incident_id, message, is_read, created_at
          FROM   notifications
          WHERE  user_id = ${user.id}
          ORDER  BY created_at DESC
          LIMIT  50
        `);
        const rows = result.rows ?? [];
        setNotifications(rows);
        setUnreadCount(rows.filter(r => !r.is_read).length);
        if (rows.length > 0) {
          lastSeenId.current = Math.max(...rows.map(r => r.id));
        }
      } catch (err) {
        console.error('Initial notification fetch error:', err);
      }
    };

    initialFetch();

    // Poll every 5 seconds
    pollInterval.current = setInterval(fetchNotifications, 5000);

    return () => clearInterval(pollInterval.current);
  }, [isLoggedIn, user?.id, fetchNotifications]);

  // ----------------------------------------------------------
  //  fireToast — adds a toast to the queue, auto-removes after 5s
  // ----------------------------------------------------------
  const fireToast = (notification) => {
    const id = `toast-${notification.id}-${Date.now()}`;
    setToasts(prev => [...prev, { ...notification, toastId: id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== id));
    }, 5000);
  };

  // ----------------------------------------------------------
  //  dismissToast — manual close by user
  // ----------------------------------------------------------
  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  // ----------------------------------------------------------
  //  markAllRead — called when user opens notification panel
  // ----------------------------------------------------------
  const markAllRead = useCallback(async () => {
    if (!user?.id || unreadCount === 0) return;
    try {
      await db.execute(sql`
        UPDATE notifications
        SET    is_read = TRUE
        WHERE  user_id = ${user.id}
        AND    is_read = FALSE
      `);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllRead error:', err);
    }
  }, [user?.id, unreadCount]);

  // ----------------------------------------------------------
  //  markOneRead
  // ----------------------------------------------------------
  const markOneRead = useCallback(async (notificationId) => {
    try {
      await db.execute(sql`
        UPDATE notifications
        SET    is_read = TRUE
        WHERE  id = ${notificationId}
      `);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('markOneRead error:', err);
    }
  }, []);

  const value = {
    notifications,   // full list for notification panel
    toasts,          // active toasts for NotifToast component
    unreadCount,     // number on the bell badge
    markAllRead,
    markOneRead,
    dismissToast,
    refetch: fetchNotifications,  // call manually after submitting a report
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render toasts at the top of the screen, above everything */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

// ── useNotifications hook ─────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside <NotificationProvider>');
  return ctx;
}

// ── ToastContainer ────────────────────────────────────────────
// Rendered inside the provider so it's always on screen.
// Toasts stack from the top, newest on top.

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{toastCss}</style>
      <div className="nt-container">
        {toasts.map(t => (
          <div key={t.toastId} className="nt-toast">
            <span className="nt-toast-icon">🔔</span>
            <span className="nt-toast-msg">{t.message}</span>
            <button
              className="nt-toast-close"
              onClick={() => onDismiss(t.toastId)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

const toastCss = `
  .nt-container {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: calc(100% - 32px);
    max-width: 440px;
    pointer-events: none;
  }

  .nt-toast {
    background: #0f2d5e;
    border: 1px solid rgba(26,86,219,0.4);
    border-left: 4px solid #1a56db;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 32px rgba(15,45,94,0.25);
    pointer-events: all;
    animation: nt-slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes nt-slideIn {
    from { opacity: 0; transform: translateY(-16px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .nt-toast-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .nt-toast-msg {
    flex: 1;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    line-height: 1.4;
  }

  .nt-toast-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    cursor: pointer;
    padding: 2px 4px;
    flex-shrink: 0;
    line-height: 1;
    border-radius: 4px;
  }

  .nt-toast-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

  @media (max-width: 480px) {
    .nt-container { top: 12px; width: calc(100% - 24px); }
    .nt-toast     { padding: 11px 12px; }
    .nt-toast-msg { font-size: 12px; }
  }
`;
