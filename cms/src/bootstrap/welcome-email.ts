import type { Core } from '@strapi/strapi';
import type { Event } from '@strapi/database';
import { buildEmailHtml } from './email-layout';

function buildWelcomeEmailHtml({ heading, shopUrl }: { heading: string; shopUrl: string }): string {
  return buildEmailHtml(`<h1 style="font-size:24px;font-weight:800;color:#101828;margin:0 0 12px;line-height:1.3;">${heading}</h1>
            <p style="font-size:14px;line-height:1.6;color:#667085;margin:0 0 28px;">Your account is ready. Find your line, whatever your level — browse the full catalog and get personalized board picks from the Surfboard Finder.</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:9px;background-color:#155EEF;">
                  <a href="${shopUrl}" style="display:inline-block;padding:15px 32px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:#FFFFFF;text-decoration:none;">Shop Now</a>
                </td>
              </tr>
            </table>`);
}

interface CreatedUser {
  email?: string;
  firstName?: string;
}

export function setupWelcomeEmail(strapi: Core.Strapi, clientUrl: string) {
  strapi.db.lifecycles.subscribe({
    models: ['plugin::users-permissions.user'],
    async afterCreate(event: Event) {
      const user = event.result as CreatedUser | undefined;
      if (!user?.email) return;

      const heading = user.firstName ? `Welcome, ${user.firstName}!` : 'Welcome to WESTLINE!';

      try {
        await strapi.plugin('email').service('email').send({
          to: user.email,
          subject: 'Welcome to WESTLINE',
          html: buildWelcomeEmailHtml({ heading, shopUrl: clientUrl }),
        });
      } catch (error) {
        strapi.log.error('[welcome email] failed to send', error);
      }
    },
  });
}
