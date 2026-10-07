import type { Core } from '@strapi/strapi';
import { grantPublicActions } from './public-permissions';

const HOMEPAGE_UID = 'api::homepage.homepage';
const PUBLIC_ACTIONS = [`${HOMEPAGE_UID}.find`];

export async function setupHomepage(strapi: Core.Strapi) {
  await grantPublicActions(strapi, PUBLIC_ACTIONS, 'homepage');
}
