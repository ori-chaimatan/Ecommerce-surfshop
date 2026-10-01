import type { Core } from '@strapi/strapi';
import { setupResetPasswordEmail } from './bootstrap/reset-password-email';
import { setupGoogleLogin } from './bootstrap/google-login';
import { setupWelcomeEmail } from './bootstrap/welcome-email';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    await setupResetPasswordEmail(strapi, clientUrl);
    await setupGoogleLogin(strapi, clientUrl);
    setupWelcomeEmail(strapi, clientUrl);
  },
};
