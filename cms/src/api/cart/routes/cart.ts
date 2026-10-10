/**
 * Custom routes only — no core CRUD router, so nothing is publicly listable. `auth: false`
 * skips users-permissions; the controller resolves the shopper from a Bearer JWT or the
 * `x-cart-token` header itself.
 */
const PUBLIC = { auth: false } as const;

export default {
  routes: [
    { method: 'GET', path: '/carts/current', handler: 'cart.current', config: PUBLIC },
    { method: 'POST', path: '/carts/current/lines', handler: 'cart.addLine', config: PUBLIC },
    { method: 'PATCH', path: '/carts/current/lines', handler: 'cart.setLineQuantity', config: PUBLIC },
    // koa-body doesn't parse DELETE bodies, so the line is identified in the path.
    { method: 'DELETE', path: '/carts/current/lines/:productDocumentId/:sizeKey', handler: 'cart.removeLine', config: PUBLIC },
    { method: 'POST', path: '/carts/merge', handler: 'cart.merge', config: PUBLIC },
  ],
};
