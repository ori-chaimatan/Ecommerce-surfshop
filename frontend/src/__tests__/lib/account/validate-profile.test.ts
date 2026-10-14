import { describe, expect, it } from 'vitest';
import { validateProfile } from '@/lib/account/validate-profile';

const valid = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };

describe('validateProfile (account-profile AC7, AC10)', () => {
  it('accepts a valid profile: trimmed, email lowercased, other fields dropped', () => {
    expect(validateProfile({ firstName: ' Jamie ', lastName: 'Rivera ', email: ' Jamie@Example.com', role: 1, id: 9 })).toEqual({
      ok: true,
      value: valid,
    });
  });

  it('requires every field', () => {
    expect(validateProfile({ firstName: '', lastName: '  ', email: '' })).toEqual({
      ok: false,
      fields: { firstName: 'Enter your first name.', lastName: 'Enter your last name.', email: 'Enter your email.' },
    });
  });

  it('caps names at 50 characters', () => {
    expect(validateProfile({ ...valid, lastName: 'r'.repeat(50) }).ok).toBe(true);
    expect(validateProfile({ ...valid, firstName: 'j'.repeat(51) })).toEqual({
      ok: false,
      fields: { firstName: 'Use at most 50 characters.' },
    });
  });

  it.each(['jamie', 'jamie@', '@example.com', 'jamie@example', 'ja mie@example.com', `${'a'.repeat(250)}@example.com`])(
    'rejects the email %s',
    (email) => {
      expect(validateProfile({ ...valid, email })).toEqual({ ok: false, fields: { email: 'Enter a valid email address.' } });
    }
  );

  it('treats a missing body or non-string values as empty', () => {
    expect(validateProfile(null)).toMatchObject({ ok: false, fields: { firstName: 'Enter your first name.' } });
    expect(validateProfile({ firstName: 1, lastName: {}, email: [] })).toMatchObject({
      ok: false,
      fields: { firstName: 'Enter your first name.', lastName: 'Enter your last name.', email: 'Enter your email.' },
    });
  });
});
