import type { Core } from '@strapi/strapi';

/**
 * Idempotently grants the users-permissions `public` role the given actions
 * (e.g. `api::product.product.find`). Existing permissions are left untouched.
 */
export async function grantPublicActions(strapi: Core.Strapi, actions: string[], label: string) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn(`[${label}] public role not found — ${actions.join(', ')} will not be publicly readable.`);
    return;
  }

  for (const action of actions) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });

    if (!existing) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } });
    }
  }
}
