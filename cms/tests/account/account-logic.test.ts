import { describe, expect, it } from 'vitest';
import { AccountError, validateProfile } from '../../src/api/account/account-logic';

const valid = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };

function fieldsOf(body: unknown) {
  try {
    validateProfile(body);
  } catch (error) {
    if (error instanceof AccountError) return { code: error.code, fields: error.fields };
    throw error;
  }
  return null;
}

describe('validateProfile (AC10)', () => {
  it('returns only firstName, lastName and email, trimmed, with the email lowercased', () => {
    expect(
      validateProfile({
        firstName: '  Jamie ',
        lastName: ' Rivera',
        email: '  Jamie@Example.COM ',
        role: 1,
        password: 'hunter22',
        id: 99,
        username: 'someone-else',
      })
    ).toEqual({ firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' });
  });

  it('requires every field', () => {
    expect(fieldsOf({ firstName: ' ', lastName: '', email: '' })).toEqual({
      code: 'bad-request',
      fields: {
        firstName: 'Enter your first name.',
        lastName: 'Enter your last name.',
        email: 'Enter your email.',
      },
    });
  });

  it('caps names at 50 characters', () => {
    expect(validateProfile({ ...valid, firstName: 'a'.repeat(50) }).firstName).toHaveLength(50);
    expect(fieldsOf({ ...valid, firstName: 'a'.repeat(51), lastName: 'b'.repeat(51) })?.fields).toEqual({
      firstName: 'Use at most 50 characters.',
      lastName: 'Use at most 50 characters.',
    });
  });

  it.each(['jamie', 'jamie@', '@example.com', 'jamie@example', 'ja mie@example.com', `${'a'.repeat(250)}@example.com`])(
    'rejects the email %s',
    (email) => {
      expect(fieldsOf({ ...valid, email })?.fields).toEqual({ email: 'Enter a valid email address.' });
    }
  );

  it('treats non-string values and a missing body as empty', () => {
    expect(fieldsOf({ firstName: 7, lastName: null, email: ['a@b.co'] })?.fields).toEqual({
      firstName: 'Enter your first name.',
      lastName: 'Enter your last name.',
      email: 'Enter your email.',
    });
    expect(fieldsOf(undefined)?.code).toBe('bad-request');
  });
});
