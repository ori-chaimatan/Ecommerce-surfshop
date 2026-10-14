import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountError } from '../../src/api/account/account-logic';
import { USER_UID, createAccountStore } from '../../src/api/account/account-store';

const profile = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie.new@example.com' };

function setup() {
  const query = { findOne: vi.fn(), update: vi.fn() };
  const strapi = { db: { query: vi.fn(() => query) } };
  return { query, strapi, store: createAccountStore(strapi as never) };
}

describe('account store: updateProfile (AC9-AC11)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    env = setup();
  });

  it("updates only the caller's own user, keeping username equal to email", async () => {
    env.query.findOne.mockResolvedValue(null);
    env.query.update.mockResolvedValue({ id: 7, ...profile, username: profile.email, password: 'hash' });

    await expect(env.store.updateProfile(7, profile)).resolves.toEqual(profile);

    expect(env.strapi.db.query).toHaveBeenCalledWith(USER_UID);
    expect(env.query.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie.new@example.com', username: 'jamie.new@example.com' },
    });
  });

  it('checks the email against other users, case-insensitively, by email or username', async () => {
    env.query.findOne.mockResolvedValue(null);
    env.query.update.mockResolvedValue({ id: 7, ...profile });

    await env.store.updateProfile(7, profile);

    expect(env.query.findOne).toHaveBeenCalledWith({
      where: {
        id: { $ne: 7 },
        $or: [{ email: { $eqi: profile.email } }, { username: { $eqi: profile.email } }],
      },
      select: ['id'],
    });
  });

  it('rejects an email another account uses with email-taken and writes nothing (AC11)', async () => {
    env.query.findOne.mockResolvedValue({ id: 12 });

    const error = await env.store.updateProfile(7, profile).catch((caught) => caught);

    expect(error).toBeInstanceOf(AccountError);
    expect(error).toMatchObject({
      code: 'email-taken',
      fields: { email: 'An account with this email already exists.' },
    });
    expect(env.query.update).not.toHaveBeenCalled();
  });

  it('treats a user that vanished mid-request as unauthorized', async () => {
    env.query.findOne.mockResolvedValue(null);
    env.query.update.mockResolvedValue(null);

    await expect(env.store.updateProfile(7, profile)).rejects.toMatchObject({ code: 'unauthorized' });
  });
});
