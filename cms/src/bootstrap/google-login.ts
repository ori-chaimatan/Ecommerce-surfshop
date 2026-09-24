import type { Core } from '@strapi/strapi';

export async function setupGoogleLogin(strapi: Core.Strapi, clientUrl: string) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    const grantStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'grant' });
    const grantSettings = ((await grantStore.get()) ?? {}) as Record<string, Record<string, unknown>>;
    const googleCallback = `${clientUrl}/connect/google/redirect`;

    const googleConfig = {
      ...grantSettings.google,
      enabled: true,
      key: googleClientId,
      secret: googleClientSecret,
      callback: googleCallback,
    };

    if (JSON.stringify(grantSettings.google) !== JSON.stringify(googleConfig)) {
      await grantStore.set({ value: { ...grantSettings, google: googleConfig } });
    }
  } else {
    strapi.log.warn(
      '[google oauth] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are not set — "Continue with Google" will not work until both are configured in cms/.env.'
    );
  }
}
