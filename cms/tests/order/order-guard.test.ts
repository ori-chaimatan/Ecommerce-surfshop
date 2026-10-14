import { describe, expect, it, vi } from 'vitest';
import {
  LOCKED_FIELDS,
  asOrderStore,
  createOrderGuard,
  isOrderStore,
  lockedChanges,
} from '../../src/api/order/order-guard';

const stored = {
  documentId: 'order-doc',
  OrderNumber: 'WL-104233',
  Status: 'processing',
  Email: 'jamie@example.com',
  ShippingMethod: 'standard',
  Subtotal: '908.98',
  ShippingCost: '0',
  Total: '908.98',
  Currency: 'USD',
  PaymentBrand: 'visa',
  PaymentLast4: '4242',
  PaymentReference: 'mock_abc',
  IdempotencyKey: '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11',
  PlacedAt: '2026-10-11T12:00:00.000Z',
  Lines: [
    { id: 9, ProductDocumentId: 'b1', Name: 'CI Pro', Slug: 'ci-pro', SizeKey: '6-0-29.9', SizeLabel: `6'0" · 29.9L`, UnitPrice: '829', Quantity: 1, LineTotal: '829', ImageUrl: '/uploads/ci.png', ImageAlt: null },
  ],
};

/** What the admin sends when only Status was changed: the whole form, values as it holds them. */
const adminSave = (overrides: Record<string, unknown> = {}) => ({
  OrderNumber: 'WL-104233',
  Status: 'shipped',
  Email: 'jamie@example.com',
  ShippingMethod: 'standard',
  Subtotal: 908.98,
  ShippingCost: 0,
  Total: 908.98,
  Currency: 'USD',
  PaymentBrand: 'visa',
  PaymentLast4: '4242',
  PaymentReference: 'mock_abc',
  PlacedAt: '2026-10-11T12:00:00Z',
  ShippingAddress: { id: 3, FirstName: 'Jamie', City: 'Malibu' },
  User: { connect: [], disconnect: [] },
  Lines: [
    { id: 9, ProductDocumentId: 'b1', Name: 'CI Pro', Slug: 'ci-pro', SizeKey: '6-0-29.9', SizeLabel: `6'0" · 29.9L`, UnitPrice: 829, Quantity: 1, LineTotal: 829, ImageUrl: '/uploads/ci.png', ImageAlt: '', Product: { connect: [], disconnect: [] } },
  ],
  ...overrides,
});

describe('LOCKED_FIELDS', () => {
  it('locks everything but Status, ShippingAddress and User', () => {
    expect([...LOCKED_FIELDS].sort()).toEqual(
      ['OrderNumber', 'Email', 'Lines', 'Subtotal', 'ShippingCost', 'Total', 'Currency', 'PaymentBrand', 'PaymentLast4', 'PaymentReference', 'ShippingMethod', 'IdempotencyKey', 'PlacedAt'].sort()
    );
  });
});

describe('lockedChanges', () => {
  it('sees no change in a full admin save that only edits Status, the address and the user', () => {
    expect(lockedChanges(stored, adminSave())).toEqual([]);
  });

  it('ignores fields the update leaves out', () => {
    expect(lockedChanges(stored, { Status: 'delivered' })).toEqual([]);
  });

  it('treats decimals, dates and empty values by value, not by format', () => {
    expect(lockedChanges(stored, { Total: '908.980', PlacedAt: '2026-10-11T14:00:00+02:00', Lines: adminSave().Lines })).toEqual([]);
  });

  it.each([
    ['Total', 1],
    ['Subtotal', 1],
    ['ShippingCost', 12],
    ['Email', 'other@example.com'],
    ['OrderNumber', 'WL-000001'],
    ['Currency', 'EUR'],
    ['PaymentBrand', 'amex'],
    ['PaymentLast4', '0000'],
    ['PaymentReference', 'mock_x'],
    ['ShippingMethod', 'express'],
    ['IdempotencyKey', 'something-else'],
    ['PlacedAt', '2020-01-01T00:00:00.000Z'],
  ])('reports a changed %s', (field, value) => {
    expect(lockedChanges(stored, { [field]: value })).toEqual([field]);
  });

  it('reports changed lines: a field, a removed line or an added one', () => {
    const [line] = adminSave().Lines;
    expect(lockedChanges(stored, { Lines: [{ ...line, Quantity: 2 }] })).toEqual(['Lines']);
    expect(lockedChanges(stored, { Lines: [{ ...line, UnitPrice: 1 }] })).toEqual(['Lines']);
    expect(lockedChanges(stored, { Lines: [] })).toEqual(['Lines']);
    expect(lockedChanges(stored, { Lines: [line, line] })).toEqual(['Lines']);
  });

  it('lists every changed field, in schema order', () => {
    expect(lockedChanges(stored, adminSave({ Total: 1, Email: 'x@example.com' }))).toEqual(['Email', 'Total']);
  });
});

describe('asOrderStore / isOrderStore', () => {
  it('marks only work run by the order store, across awaits', async () => {
    expect(isOrderStore()).toBe(false);
    await asOrderStore(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(isOrderStore()).toBe(true);
    });
    expect(isOrderStore()).toBe(false);
  });
});

describe('order guard document middleware', () => {
  const setup = (current: object | null = stored) => {
    const findOne = vi.fn(async () => current);
    const strapi = { db: { query: vi.fn(() => ({ findOne })) } };
    const guard = createOrderGuard(strapi as never);
    const next = vi.fn(async () => 'result');
    const run = (action: string, params: object, uid = 'api::order.order') => guard({ uid, action, params } as never, next);
    return { run, next, findOne };
  };

  it('leaves other content types alone', async () => {
    const { run, next } = setup();
    await run('create', { data: {} }, 'api::product.product');
    expect(next).toHaveBeenCalled();
  });

  it('rejects a create that does not come from the order store (admin "Create new entry", API)', async () => {
    const { run, next } = setup();
    await expect(run('create', { data: { OrderNumber: 'WL-1' } })).rejects.toThrow('Orders are created at checkout only.');
    await expect(run('clone', { documentId: 'order-doc', data: {} })).rejects.toThrow('Orders are created at checkout only.');
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with a ValidationError, so the admin and the API answer 400 with the message', async () => {
    const { run } = setup();
    await expect(run('create', { data: {} })).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('lets the order store create orders', async () => {
    const { run, next } = setup();
    await expect(asOrderStore(() => run('create', { data: { OrderNumber: 'WL-1' } }))).resolves.toBe('result');
    expect(next).toHaveBeenCalled();
  });

  it('lets an admin save that only changes Status, the address or the user through', async () => {
    const { run, next, findOne } = setup();
    await expect(run('update', { documentId: 'order-doc', data: adminSave() })).resolves.toBe('result');
    expect(findOne).toHaveBeenCalledWith({ where: { documentId: 'order-doc' }, populate: { Lines: true } });
    expect(next).toHaveBeenCalled();
  });

  it('rejects an update that changes a locked field, naming it', async () => {
    const { run, next } = setup();
    await expect(run('update', { documentId: 'order-doc', data: { Status: 'shipped', Total: 1 } })).rejects.toThrow(
      'These order fields are read-only: Total.'
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('skips the lookup for an update that sends no locked field', async () => {
    const { run, next, findOne } = setup();
    await run('update', { documentId: 'order-doc', data: { Status: 'delivered' } });
    expect(findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('lets the order store update anything', async () => {
    const { run, next } = setup();
    await asOrderStore(() => run('update', { documentId: 'order-doc', data: { Total: 1 } }));
    expect(next).toHaveBeenCalled();
  });

  it('passes reads and deletes through', async () => {
    const { run, next } = setup();
    await run('findOne', { documentId: 'order-doc' });
    await run('delete', { documentId: 'order-doc' });
    expect(next).toHaveBeenCalledTimes(2);
  });
});
