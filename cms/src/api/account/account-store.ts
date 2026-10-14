import type { Core } from '@strapi/strapi';
import { AccountError, EMAIL_TAKEN, type Profile } from './account-logic';

export const USER_UID = 'plugin::users-permissions.user';

export interface AccountStore {
  updateProfile(userId: number, profile: Profile): Promise<Profile>;
}

/**
 * Writes the signed-in shopper's own user row. Register sets `username` to the email, so the
 * two move together, and an email is taken if another user has it as either.
 */
export function createAccountStore(strapi: Core.Strapi): AccountStore {
  const users = () => strapi.db.query(USER_UID);

  return {
    async updateProfile(userId, profile) {
      const clash = await users().findOne({
        where: {
          id: { $ne: userId },
          $or: [{ email: { $eqi: profile.email } }, { username: { $eqi: profile.email } }],
        },
        select: ['id'],
      });
      if (clash) throw new AccountError('email-taken', EMAIL_TAKEN, { email: EMAIL_TAKEN });

      const updated = await users().update({
        where: { id: userId },
        data: { ...profile, username: profile.email },
      });
      if (!updated) throw new AccountError('unauthorized', 'Sign in to continue.');

      return { firstName: updated.firstName, lastName: updated.lastName, email: updated.email };
    },
  };
}
