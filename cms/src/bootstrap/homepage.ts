import type { Core } from '@strapi/strapi';

const HOMEPAGE_UID = 'api::homepage.homepage';
const PUBLIC_ACTIONS = [`${HOMEPAGE_UID}.find`];

async function grantPublicRead(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[homepage] public role not found — GET /api/homepage will not be publicly readable.');
    return;
  }

  for (const action of PUBLIC_ACTIONS) {
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

export async function setupHomepage(strapi: Core.Strapi) {
  await grantPublicRead(strapi);
}
