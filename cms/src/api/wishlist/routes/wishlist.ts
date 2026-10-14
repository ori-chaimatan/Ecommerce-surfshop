/**
 * Custom routes only — no core CRUD router, so wishlist items are never listable or
 * addressable by id. `auth: false` skips users-permissions; the controller requires a signed-in
 * user from the Bearer JWT. The product is in the path because koa-body doesn't parse DELETE bodies.
 */
const PUBLIC = { auth: false } as const;

export default {
  routes: [
    { method: 'GET', path: '/wishlist', handler: 'wishlist.list', config: PUBLIC },
    { method: 'PUT', path: '/wishlist/items/:slug', handler: 'wishlist.add', config: PUBLIC },
    { method: 'DELETE', path: '/wishlist/items/:slug', handler: 'wishlist.remove', config: PUBLIC },
  ],
};
