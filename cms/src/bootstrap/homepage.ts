import type { Core } from '@strapi/strapi';
import { grantPublicActions } from './public-permissions';

const HOMEPAGE_UID = 'api::homepage.homepage';
const PUBLIC_ACTIONS = [`${HOMEPAGE_UID}.find`];

export async function setupHomepage(strapi: Core.Strapi) {
  // Re-granted on every boot on purpose: the homepage must stay publicly readable (AC4), so a removed grant comes back on restart.
  await grantPublicActions(strapi, PUBLIC_ACTIONS, 'homepage');
}
