/**
 * Session management utility to track user activity and prevent premature logout
 */

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'touchmove', 'click'];
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours of inactivity (mobile-friendly)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes (less frequent)

let lastActivityTime = Date.now();
let inactivityTimer: NodeJS.Timeout | null = null;
let sessionCheckTimer: NodeJS.Timeout | null = null;

/**
 * Update last activity timestamp
 */
function updateActivity() {
  lastActivityTime = Date.now();
  localStorage.setItem('last_activity', lastActivityTime.toString());
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;

  const expirationTime = parseInt(expiresAt, 10);
  const now = Date.now();

  // Consider expired if less than 5 minutes remaining
  return now >= (expirationTime - 5 * 60 * 1000);
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTimeUntilExpiration(): number {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return 0;

  const expirationTime = parseInt(expiresAt, 10);
  const now = Date.now();

  return Math.max(0, expirationTime - now);
}

/**
 * Initialize session tracking
 */
export function initSessionTracking(onLogout?: () => void) {
  // Track user activity
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  // Initialize last activity
  updateActivity();

  // Check for inactivity periodically
  if (onLogout) {
    inactivityTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;

      // Only logout if token is actually expired AND user has been inactive
      if (timeSinceActivity >= INACTIVITY_TIMEOUT && isTokenExpired()) {
        console.log('[Session] Token expired and user inactive, logging out...');
        cleanupSessionTracking();
        onLogout();
      }
    }, SESSION_CHECK_INTERVAL);
  }

  console.log('[Session] Session tracking initialized');
}

/**
 * Cleanup session tracking
 */
export function cleanupSessionTracking() {
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, updateActivity);
  });

  if (inactivityTimer) {
    clearInterval(inactivityTimer);
    inactivityTimer = null;
  }

  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = null;
  }

  console.log('[Session] Session tracking cleaned up');
}

/**
 * Get time since last activity (in milliseconds)
 */
export function getTimeSinceLastActivity(): number {
  return Date.now() - lastActivityTime;
}
