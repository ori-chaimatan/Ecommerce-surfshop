// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe } from '@/lib/strapi/account';

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
