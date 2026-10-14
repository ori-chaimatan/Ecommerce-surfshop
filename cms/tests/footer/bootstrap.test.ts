import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ grantPublicActions: vi.fn(async () => {}) }));
vi.mock('../../src/bootstrap/public-permissions', () => ({ grantPublicActions: mocks.grantPublicActions }));

import { setupFooter } from '../../src/bootstrap/footer';

describe('setupFooter (site-footer AC2)', () => {
  it('grants the public role read access to the footer, and nothing else', async () => {
    const strapi = {};
    await setupFooter(strapi as never);
    expect(mocks.grantPublicActions).toHaveBeenCalledWith(strapi, ['api::footer.footer.find'], 'footer');
  });
});
