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
