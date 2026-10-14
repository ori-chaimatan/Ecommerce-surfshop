// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe, updateMe } from '@/lib/strapi/account';

const mockFetch = vi.fn();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('lib/strapi/account getMe (checkout AC9, AC21)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the signed-in shopper's email and name from /api/users/me", async () => {
    mockFetch.mockResolvedValueOnce(json({ id: 7, email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera', username: 'jamie' }));

    await expect(getMe('jwt-1')).resolves.toEqual({ email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/users\/me$/);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
    expect(init.cache).toBe('no-store');
  });

  it('defaults missing names to empty strings (Google sign-ups have none)', async () => {
    mockFetch.mockResolvedValueOnce(json({ email: 'g@example.com' }));
    await expect(getMe('jwt-1')).resolves.toEqual({ email: 'g@example.com', firstName: '', lastName: '' });
  });

  it('returns null on a rejected session, an error, or a bad shape', async () => {
    mockFetch.mockResolvedValueOnce(json({ error: {} }, 401));
    await expect(getMe('jwt-1')).resolves.toBeNull();
    mockFetch.mockRejectedValueOnce(new Error('down'));
    await expect(getMe('jwt-1')).resolves.toBeNull();
    mockFetch.mockResolvedValueOnce(json({ id: 7 }));
    await expect(getMe('jwt-1')).resolves.toBeNull();
  });
});

const PROFILE = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie.new@example.com' };

describe('lib/strapi/account updateMe (account-profile AC9-AC12)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('PATCHes /api/account/profile with the JWT and returns the saved profile', async () => {
    mockFetch.mockResolvedValueOnce(json({ profile: PROFILE }));

    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: true, profile: PROFILE });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/account\/profile$/);
    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
    expect(JSON.parse(init.body as string)).toEqual(PROFILE);
  });

  it('maps a 401 to unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(json({ error: { code: 'unauthorized' } }, 401));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: false, reason: 'unauthorized' });
  });

  it("maps a 409 email-taken to the email field error, with Strapi's message", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ error: { code: 'email-taken', fields: { email: 'An account with this email already exists.' } } }, 409)
    );
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({
      ok: false,
      reason: 'invalid',
      fields: { email: 'An account with this email already exists.' },
    });
  });

  it("maps a 400 to Strapi's field errors", async () => {
    mockFetch.mockResolvedValueOnce(json({ error: { code: 'bad-request', fields: { firstName: 'Enter your first name.' } } }, 400));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({
      ok: false,
      reason: 'invalid',
      fields: { firstName: 'Enter your first name.' },
    });
  });

  it('maps a network failure, a 500 or a bad shape to failed', async () => {
    mockFetch.mockRejectedValueOnce(new Error('down'));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: false, reason: 'failed' });
    mockFetch.mockResolvedValueOnce(json({ error: {} }, 500));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: false, reason: 'failed' });
    mockFetch.mockResolvedValueOnce(json({ profile: { firstName: 'x' } }));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: false, reason: 'failed' });
    mockFetch.mockResolvedValueOnce(json({ error: { code: 'bad-request' } }, 400));
    await expect(updateMe('jwt-1', PROFILE)).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});
