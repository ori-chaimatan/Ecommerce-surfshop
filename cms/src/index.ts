import type { Core } from '@strapi/strapi';
import { setupResetPasswordEmail } from './bootstrap/reset-password-email';
import { setupGoogleLogin } from './bootstrap/google-login';
import { setupWelcomeEmail } from './bootstrap/welcome-email';
import { setupHomepage } from './bootstrap/homepage';
import { setupFooter } from './bootstrap/footer';
import { setupCatalog } from './bootstrap/catalog';
import { registerClearStaleSizes } from './api/product/documents/clear-stale-sizes';
import { registerOrderGuard } from './api/order/order-guard';
import { setupOrderAdmin } from './bootstrap/order-admin';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerClearStaleSizes(strapi);
    registerOrderGuard(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    await setupResetPasswordEmail(strapi, clientUrl);
    await setupGoogleLogin(strapi, clientUrl);
    setupWelcomeEmail(strapi, clientUrl);
    await setupHomepage(strapi);
    await setupFooter(strapi);
    await setupCatalog(strapi);
    await setupOrderAdmin(strapi);
  },
};
