import type { Core } from '@strapi/strapi';
import { grantPublicActions } from './public-permissions';

const FOOTER_UID = 'api::footer.footer';
const PUBLIC_ACTIONS = [`${FOOTER_UID}.find`];

export async function setupFooter(strapi: Core.Strapi) {
  // Re-granted on every boot on purpose: the footer must stay publicly readable (site-footer AC2).
  await grantPublicActions(strapi, PUBLIC_ACTIONS, 'footer');
}
