import { describe, expect, it, vi } from 'vitest';
import { createIdentify } from '../../src/api/cart/identity';

const TOKEN = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';

function fakeStrapi(payload: unknown, user: unknown) {
  const verify = vi.fn(() => (payload instanceof Error ? Promise.reject(payload) : Promise.resolve(payload)));
  const findOne = vi.fn(async () => user);
  const strapi = {
    plugin: vi.fn(() => ({ service: vi.fn(() => ({ verify })) })),
    db: { query: vi.fn(() => ({ findOne })) },
  };
  return { strapi, verify, findOne };
}

const ctx = (header: Record<string, string>) => ({ request: { header } }) as never;

describe('identify (cart AC2, order AC3)', () => {
  it('resolves a valid Bearer JWT to its user', async () => {
    const env = fakeStrapi({ id: 7 }, { id: 7, documentId: 'user-doc-7', email: 'jamie@example.com', blocked: false });
    const identify = createIdentify(env.strapi as never);

    await expect(identify(ctx({ authorization: 'Bearer abc' }))).resolves.toEqual({
      kind: 'user',
      userId: 7,
      userDocumentId: 'user-doc-7',
      email: 'jamie@example.com',
    });
    expect(env.verify).toHaveBeenCalledWith('abc');
    expect(env.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it.each([
    ['an invalid JWT', new Error('bad'), null, 'Bearer abc'],
    ['a deleted user', { id: 7 }, null, 'Bearer abc'],
    ['a blocked user', { id: 7 }, { id: 7, documentId: 'u', blocked: true }, 'Bearer abc'],
    ['a non-Bearer scheme', { id: 7 }, { id: 7, documentId: 'u' }, 'Basic abc'],
    ['a Bearer with no token', { id: 7 }, { id: 7, documentId: 'u' }, 'Bearer'],
  ])('rejects %s with unauthorized', async (_label, payload, user, authorization) => {
    const identify = createIdentify(fakeStrapi(payload, user).strapi as never);
    await expect(identify(ctx({ authorization }))).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('falls back to a well-formed guest token', async () => {
    const identify = createIdentify(fakeStrapi(null, null).strapi as never);
    await expect(identify(ctx({ 'x-cart-token': TOKEN }))).resolves.toEqual({ kind: 'guest', token: TOKEN });
  });

  it('ignores a malformed guest token, and no headers means nobody', async () => {
    const identify = createIdentify(fakeStrapi(null, null).strapi as never);
    await expect(identify(ctx({ 'x-cart-token': 'nope' }))).resolves.toEqual({ kind: 'none' });
    await expect(identify(ctx({}))).resolves.toEqual({ kind: 'none' });
  });
});
