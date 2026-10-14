/**
 * Custom routes only. Strapi's own PUT /users/:id has no ownership check, so it stays closed;
 * this route only ever writes the caller's user. `auth: false` skips users-permissions; the
 * controller requires a signed-in user from the Bearer JWT.
 */
const PUBLIC = { auth: false } as const;

export default {
  routes: [{ method: 'PATCH', path: '/account/profile', handler: 'account.updateProfile', config: PUBLIC }],
};
