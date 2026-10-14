/**
 * Pure profile rules for PATCH /account/profile. Same wording as the storefront's
 * frontend/src/lib/account/validate-profile.ts, which checks the form first. No Strapi
 * calls here — account-store.ts does the uniqueness read and the write.
 */

export type AccountErrorCode = 'bad-request' | 'unauthorized' | 'email-taken';

export class AccountError extends Error {
  constructor(
    readonly code: AccountErrorCode,
    message: string = code,
    readonly fields?: Record<string, string>
  ) {
    super(message);
  }
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
}

const NAME_MAX = 50;
const EMAIL_MAX = 254;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_TAKEN = 'An account with this email already exists.';

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Whitelists firstName, lastName and email; anything else in the body is ignored. */
export function validateProfile(body: unknown): Profile {
  const raw = (body ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const name = (key: 'firstName' | 'lastName', label: string) => {
    const value = text(raw[key]);
    if (!value) fields[key] = `Enter your ${label}.`;
    else if (value.length > NAME_MAX) fields[key] = `Use at most ${NAME_MAX} characters.`;
    return value;
  };

  const firstName = name('firstName', 'first name');
  const lastName = name('lastName', 'last name');
  const email = text(raw.email).toLowerCase();
  if (!email) fields.email = 'Enter your email.';
  else if (email.length > EMAIL_MAX || !EMAIL.test(email)) fields.email = 'Enter a valid email address.';

  if (Object.keys(fields).length) throw new AccountError('bad-request', 'Check the highlighted fields.', fields);
  return { firstName, lastName, email };
}
