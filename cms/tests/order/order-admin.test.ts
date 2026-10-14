import { describe, expect, it, vi } from 'vitest';
import { lockOrderEditView, lockOrderLineView, removeOrderCreatePermissions } from '../../src/bootstrap/order-admin';

const meta = (editable = true) => ({ edit: { label: 'x', description: '', placeholder: '', visible: true, editable }, list: { label: 'x' } });

const config = {
  settings: { mainField: 'OrderNumber' },
  layouts: {
    list: ['id', 'OrderNumber', 'Status', 'User'],
    edit: [
      [{ name: 'OrderNumber', size: 6 }, { name: 'Status', size: 6 }],
      [{ name: 'User', size: 6 }, { name: 'Email', size: 6 }],
      [{ name: 'ShippingAddress', size: 12 }],
      [{ name: 'ShippingMethod', size: 6 }],
      [{ name: 'Lines', size: 12 }],
      [{ name: 'Subtotal', size: 4 }, { name: 'ShippingCost', size: 4 }, { name: 'Total', size: 4 }],
      [{ name: 'Currency', size: 6 }, { name: 'PaymentBrand', size: 6 }],
      [{ name: 'PaymentLast4', size: 6 }, { name: 'PaymentReference', size: 6 }],
      [{ name: 'IdempotencyKey', size: 6 }, { name: 'PlacedAt', size: 6 }],
    ],
  },
  metadatas: Object.fromEntries(
    ['id', 'OrderNumber', 'Status', 'User', 'Email', 'ShippingAddress', 'ShippingMethod', 'Lines', 'Subtotal', 'ShippingCost', 'Total', 'Currency', 'PaymentBrand', 'PaymentLast4', 'PaymentReference', 'IdempotencyKey', 'PlacedAt'].map((f) => [f, f === 'id' ? {} : meta()])
  ),
};

describe('lockOrderEditView (order admin read-only fields)', () => {
  const next = lockOrderEditView(config)!;

  it('makes the locked fields non-editable and keeps Status, ShippingAddress and User editable', () => {
    for (const field of ['OrderNumber', 'Email', 'Lines', 'Subtotal', 'ShippingCost', 'Total', 'Currency', 'PaymentBrand', 'PaymentLast4', 'PaymentReference', 'ShippingMethod', 'PlacedAt']) {
      expect(next.metadatas[field].edit).toMatchObject({ editable: false, visible: true });
    }
    for (const field of ['Status', 'ShippingAddress', 'User']) expect(next.metadatas[field].edit.editable).toBe(true);
  });

  it('hides IdempotencyKey from the edit view entirely', () => {
    expect(next.metadatas.IdempotencyKey.edit).toMatchObject({ visible: false, editable: false });
    expect(next.layouts.edit.flat().map((f: { name: string }) => f.name)).not.toContain('IdempotencyKey');
    expect(next.layouts.edit).toContainEqual([{ name: 'PlacedAt', size: 6 }]);
  });

  it('keeps everything else as it was', () => {
    expect(next.settings).toEqual(config.settings);
    expect(next.layouts.list).toEqual(config.layouts.list);
    expect(next.metadatas.Status).toEqual(config.metadatas.Status);
  });

  it('returns null when the view is already locked (idempotent boot)', () => {
    expect(lockOrderEditView(next)).toBeNull();
  });

  it('returns null for a missing config', () => {
    expect(lockOrderEditView(null)).toBeNull();
  });
});

describe('lockOrderLineView (fields inside each order line)', () => {
  const lineConfig = {
    uid: 'order.line',
    settings: { mainField: 'ProductDocumentId' },
    layouts: { edit: [[{ name: 'Product', size: 6 }, { name: 'Name', size: 6 }]] },
    metadatas: Object.fromEntries(
      ['id', 'Product', 'ProductDocumentId', 'Name', 'Slug', 'SizeKey', 'SizeLabel', 'UnitPrice', 'Quantity', 'LineTotal', 'ImageUrl', 'ImageAlt'].map((f) => [f, f === 'id' ? {} : meta()])
    ),
  };

  it('makes every field of a line non-editable, layout untouched', () => {
    const next = lockOrderLineView(lineConfig)!;
    for (const [field, value] of Object.entries(next.metadatas)) {
      if (field !== 'id') expect((value as { edit: { editable: boolean } }).edit.editable).toBe(false);
    }
    expect(next.layouts).toEqual(lineConfig.layouts);
    expect(next.settings).toEqual(lineConfig.settings);
  });

  it('is idempotent and ignores a missing config', () => {
    expect(lockOrderLineView(lockOrderLineView(lineConfig))).toBeNull();
    expect(lockOrderLineView(null)).toBeNull();
  });
});

describe('removeOrderCreatePermissions', () => {
  it('deletes the content-manager create permission on Order for every role', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const strapi = { db: { query: vi.fn(() => ({ deleteMany })) } };

    await expect(removeOrderCreatePermissions(strapi as never)).resolves.toBe(1);
    expect(strapi.db.query).toHaveBeenCalledWith('admin::permission');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { action: 'plugin::content-manager.explorer.create', subject: 'api::order.order' },
    });
  });
});
