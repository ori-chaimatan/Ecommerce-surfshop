// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter (checkout AC20)', () => {
  it('allows the limit, blocks the next, and resets after the window', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });

    expect([1, 2, 3].map(() => limiter.hit('a').ok)).toEqual([true, true, true]);
    expect(limiter.hit('a')).toEqual({ ok: false, retryAfter: 60 });

    now = 45_000;
    expect(limiter.hit('a')).toEqual({ ok: false, retryAfter: 15 });

    now = 60_000;
    expect(limiter.hit('a').ok).toBe(true);
  });

  it('counts each key separately', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(limiter.hit('a').ok).toBe(true);
    expect(limiter.hit('b').ok).toBe(true);
    expect(limiter.hit('a').ok).toBe(false);
  });

  it('rounds retryAfter up to at least one second', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    limiter.hit('a');
    now = 999.5;
    expect(limiter.hit('a').retryAfter).toBe(1);
  });

  it('forgets expired windows so memory stays bounded', () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    for (let i = 0; i < 50; i += 1) limiter.hit(`ip-${i}`);
    now = 5000;
    limiter.hit('fresh');
    expect(limiter.size()).toBe(1);
  });
});

describe('clientIp', () => {
  const request = (headers: Record<string, string>) => new Request('http://localhost/api/checkout', { headers });

  it('uses the first x-forwarded-for hop', () => {
    expect(clientIp(request({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then a shared bucket', () => {
    expect(clientIp(request({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientIp(request({}))).toBe('unknown');
  });
});
