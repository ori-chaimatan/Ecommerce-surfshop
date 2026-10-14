/**
 * Custom routes only — no core CRUD router, so orders are never listable. `auth: false`
 * skips users-permissions; the controller requires a signed-in user from the Bearer JWT.
 */
const PUBLIC = { auth: false } as const;

export default {
  routes: [
    { method: 'POST', path: '/orders', handler: 'order.place', config: PUBLIC },
    { method: 'GET', path: '/orders', handler: 'order.list', config: PUBLIC },
    { method: 'GET', path: '/orders/:orderNumber', handler: 'order.findOne', config: PUBLIC },
  ],
};
