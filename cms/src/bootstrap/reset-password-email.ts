import type { Core } from '@strapi/strapi';
import { buildEmailHtml } from './email-layout';

export async function setupResetPasswordEmail(strapi: Core.Strapi, clientUrl: string) {
  const resetPasswordUrl = `${clientUrl}/reset-password`;

  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
  const advanced = ((await pluginStore.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;

  if (advanced.email_reset_password !== resetPasswordUrl) {
    await pluginStore.set({
      key: 'advanced',
      value: { ...advanced, email_reset_password: resetPasswordUrl },
    });
  }

  const emailTemplates = ((await pluginStore.get({ key: 'email' })) ?? {}) as Record<
    string,
    { options?: { from?: { name?: string; email?: string }; message?: string } }
  >;
  const resendFromEmail = 'onboarding@resend.dev';
  const resetPasswordMessage = buildEmailHtml(`<h1 style="font-size:24px;font-weight:800;color:#101828;margin:0 0 12px;line-height:1.3;">Reset your password</h1>
            <p style="font-size:14px;line-height:1.6;color:#667085;margin:0 0 8px;">We heard that you lost your password. No worries — click the button below to choose a new one.</p>
            <p style="font-size:14px;line-height:1.6;color:#667085;margin:0 0 28px;">If you didn't request this, you can safely ignore this email.</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:9px;background-color:#155EEF;">
                  <a href="<%= URL %>?code=<%= TOKEN %>" style="display:inline-block;padding:15px 32px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:#FFFFFF;text-decoration:none;">Reset Password</a>
                </td>
              </tr>
            </table>`);

  if (
    emailTemplates.reset_password?.options?.from?.email !== resendFromEmail ||
    emailTemplates.reset_password?.options?.message !== resetPasswordMessage
  ) {
    await pluginStore.set({
      key: 'email',
      value: {
        ...emailTemplates,
        reset_password: {
          ...emailTemplates.reset_password,
          options: {
            ...emailTemplates.reset_password?.options,
            from: { ...emailTemplates.reset_password?.options?.from, email: resendFromEmail },
            message: resetPasswordMessage,
          },
        },
      },
    });
  }
}
