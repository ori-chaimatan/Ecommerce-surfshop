/**
 * Profile validation, shared by the Account Details form (client) and the profile route
 * (server). It mirrors cms/src/api/account/account-logic.ts, which re-validates everything.
 */
import { texts } from './validate-texts';

/** Every form field, in visual order — the first one with an error takes focus. */
export const PROFILE_FIELDS = ['firstName', 'lastName', 'email'] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export type ProfileErrors = Partial<Record<ProfileField, string>>;

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
}

const NAME_MAX = 50;
const EMAIL_MAX = 254;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Only firstName, lastName and email are read; anything else in the body is dropped. */
export function validateProfile(body: unknown): { ok: true; value: Profile } | { ok: false; fields: ProfileErrors } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const fields: ProfileErrors = {};

  const name = (key: 'firstName' | 'lastName', label: string) => {
    const value = text(raw[key]);
    if (!value) fields[key] = texts.required(label);
    else if (value.length > NAME_MAX) fields[key] = texts.tooLong(NAME_MAX);
    return value;
  };

  const firstName = name('firstName', 'first name');
  const lastName = name('lastName', 'last name');
  const email = text(raw.email).toLowerCase();
  if (!email) fields.email = texts.required('email');
  else if (email.length > EMAIL_MAX || !EMAIL.test(email)) fields.email = texts.email;

  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value: { firstName, lastName, email } };
}
