// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updateMe: vi.fn() }));
vi.mock('@/lib/strapi/account', () => ({ updateMe: mocks.updateMe }));

import { PATCH } from '@/app/api/account/profile/route';

const PROFILE = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };

function request(body: unknown, session = true) {
  return new NextRequest('http://localhost/api/account/profile', {
    method: 'PATCH',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: session ? { cookie: 'westline_session=jwt-1' } : {},
  });
}

describe('PATCH /api/account/profile (account-profile AC9-AC12)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('answers 401 without a session, without calling Strapi', async () => {
    const response = await PATCH(request(PROFILE, false));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'unauthorized' } });
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('answers 400 with field errors for an invalid or unparsable body', async () => {
    const response = await PATCH(request({ ...PROFILE, email: 'nope' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'bad-request', fields: { email: 'Enter a valid email address.' } } });

    expect((await PATCH(request('{not json'))).status).toBe(400);
    expect(mocks.updateMe).not.toHaveBeenCalled();
  });

  it('saves only the validated fields and returns the profile, uncached', async () => {
    mocks.updateMe.mockResolvedValue({ ok: true, profile: PROFILE });

    const response = await PATCH(request({ ...PROFILE, email: ' Jamie@Example.com ', role: 1 }));

    expect(mocks.updateMe).toHaveBeenCalledWith('jwt-1', PROFILE);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ profile: PROFILE });
  });

  it("passes Strapi's field errors on as 400 (taken email, AC11)", async () => {
    mocks.updateMe.mockResolvedValue({ ok: false, reason: 'invalid', fields: { email: 'An account with this email already exists.' } });

    const response = await PATCH(request(PROFILE));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: 'bad-request', fields: { email: 'An account with this email already exists.' } },
    });
  });

  it('answers 401 when Strapi rejects the session', async () => {
    mocks.updateMe.mockResolvedValue({ ok: false, reason: 'unauthorized' });
    expect((await PATCH(request(PROFILE))).status).toBe(401);
  });

  it('answers 502 when Strapi fails', async () => {
    mocks.updateMe.mockResolvedValue({ ok: false, reason: 'failed' });
    const response = await PATCH(request(PROFILE));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: { code: 'failed' } });
  });
});
