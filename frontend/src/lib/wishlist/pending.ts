/**
 * The one-time marker behind "saved automatically after login". A guest's heart click marks
 * the slug in this tab before going to sign in; on landing back, `?wishlist=<slug>` is only
 * honoured if the marker matches. A shared link carrying `?wishlist=` saves nothing.
 * Unavailable storage fails closed: nothing is auto-saved.
 */
export const PENDING_KEY = 'westline_wishlist_pending';
export const PENDING_TTL_MS = 10 * 60 * 1000;

export function markPending(slug: string, now = Date.now()): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ slug, at: now }));
  } catch {
    // Storage blocked: the save just won't happen after login.
  }
}

/** True once for a fresh marker on this slug; the marker is consumed either way. */
export function takePending(slug: string, now = Date.now()): boolean {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return false;
    const marker = JSON.parse(raw) as { slug?: unknown; at?: unknown };
    return marker.slug === slug && typeof marker.at === 'number' && now - marker.at <= PENDING_TTL_MS;
  } catch {
    return false;
  }
}
