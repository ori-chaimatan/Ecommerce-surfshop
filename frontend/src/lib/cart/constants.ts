/** Cart constants shared by the /api/cart routes and the client (no server-only imports here). */

/** The most of one line a cart can hold; both proxies reject more, and the stepper stops here. */
export const MAX_LINE_QUANTITY = 99;

/** Response header telling the client the session cookie was dropped, so it can refresh the header. */
export const SESSION_STATE_HEADER = 'x-westline-session';
