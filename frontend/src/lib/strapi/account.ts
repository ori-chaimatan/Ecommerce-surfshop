import type { Profile, ProfileErrors } from '@/lib/account/validate-profile';
import { strapiRequest } from './client';

export interface Me {
  email: string;
  firstName: string;
  lastName: string;
}

/** The signed-in shopper, for prefilling checkout. Null when the session is rejected or Strapi fails. */
export async function getMe(jwt: string): Promise<Me | null> {
  const { ok, data } = await strapiRequest('users/me', {
    label: 'account',
    headers: { Authorization: `Bearer ${jwt}` },
    silentStatuses: [401],
  });

  const user = data as { email?: unknown; firstName?: unknown; lastName?: unknown } | null;
  if (!ok || typeof user?.email !== 'string') return null;
  return {
    email: user.email,
    firstName: typeof user.firstName === 'string' ? user.firstName : '',
    lastName: typeof user.lastName === 'string' ? user.lastName : '',
  };
}

export type UpdateMeResult =
  | { ok: true; profile: Me }
  | { ok: false; reason: 'invalid'; fields: ProfileErrors }
  | { ok: false; reason: 'unauthorized' | 'failed' };

const isProfile = (value: unknown): value is Me => {
  const profile = value as Partial<Record<keyof Me, unknown>> | null;
  return typeof profile?.email === 'string' && typeof profile.firstName === 'string' && typeof profile.lastName === 'string';
};

/** Saves the signed-in shopper's own name and email (cms `PATCH /account/profile`). */
export async function updateMe(jwt: string, profile: Profile): Promise<UpdateMeResult> {
  const { ok, status, data } = await strapiRequest('account/profile', {
    label: 'account',
    method: 'PATCH',
    body: profile,
    headers: { Authorization: `Bearer ${jwt}` },
    silentStatuses: [400, 401, 409],
  });

  const body = data as { profile?: unknown; error?: { fields?: unknown } } | null;
  if (ok) return isProfile(body?.profile) ? { ok: true, profile: body.profile } : { ok: false, reason: 'failed' };
  if (status === 401) return { ok: false, reason: 'unauthorized' };

  const fields = body?.error?.fields;
  if ((status === 400 || status === 409) && fields && typeof fields === 'object') {
    return { ok: false, reason: 'invalid', fields: fields as ProfileErrors };
  }
  return { ok: false, reason: 'failed' };
}
