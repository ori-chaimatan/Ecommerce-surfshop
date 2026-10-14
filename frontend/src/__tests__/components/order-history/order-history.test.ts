import { describe, expect, it } from 'vitest';
import { initialsOf, toOrderHistoryItem } from '@/components/order-history/order-history';
import { line, order } from './order-fixtures';

describe('toOrderHistoryItem (order-history AC2, AC3, AC5)', () => {
  it('maps the summary: number, placed date (UTC), item count, status and total', () => {
    const item = toOrderHistoryItem(order());

    expect(item.orderNumber).toBe('WL-104233');
    // 23:30 UTC on Aug 22 must not drift to Aug 23 in another time zone.
    expect(item.placedLabel).toBe('Placed Aug 22, 2026');
    expect(item.itemCount).toBe('3 items');
    expect(item.status).toEqual({ key: 'delivered', label: 'Delivered' });
    expect(item.total).toBe('$187');
  });

  it('says "1 item" for a single quantity', () => {
    expect(toOrderHistoryItem(order({ lines: [line({ quantity: 1, lineTotal: 79 })] })).itemCount).toBe('1 item');
  });

  it.each([
    ['processing', 'processing', 'Processing'],
    ['shipped', 'shipped', 'Shipped'],
    ['delivered', 'delivered', 'Delivered'],
    ['cancelled', 'cancelled', 'Cancelled'],
    ['on-hold', 'processing', 'On-hold'],
  ])('status %s → %s pill labelled %s', (status, key, label) => {
    expect(toOrderHistoryItem(order({ status })).status).toEqual({ key, label });
  });

  it('maps each line: thumbnail or initials, name, "size · Qty N", line total', () => {
    const [shorts, wax] = toOrderHistoryItem(order()).lines;

    expect(shorts).toEqual({
      key: 'shorts-1:M',
      name: 'Samurai Pro 22" Boardshort',
      spec: 'M · Qty 2',
      lineTotal: '$158',
      thumb: { kind: 'image', src: 'http://localhost:1337/uploads/samurai.jpg', alt: 'Samurai boardshort' },
    });
    expect(wax).toMatchObject({ spec: 'One Size · Qty 1', lineTotal: '$29', thumb: { kind: 'initials', text: 'SW' } });
  });

  it("uses the first line's thumbnail as the preview", () => {
    expect(toOrderHistoryItem(order()).preview).toEqual({
      kind: 'image',
      src: 'http://localhost:1337/uploads/samurai.jpg',
      alt: 'Samurai boardshort',
    });
  });

  it('maps the totals, with "Free" shipping at 0', () => {
    expect(toOrderHistoryItem(order())).toMatchObject({ subtotal: '$187', shipping: 'Free', total: '$187' });
    expect(toOrderHistoryItem(order({ shippingCost: 12, total: 199 }))).toMatchObject({ shipping: '$12', total: '$199' });
  });

  it('leaves the date blank rather than inventing one when placedAt is invalid', () => {
    expect(toOrderHistoryItem(order({ placedAt: 'nope' })).placedLabel).toBe('');
  });
});

describe('initialsOf (design gap: thumbnail without an image)', () => {
  it.each([
    ['Surf Wax — 3 Pack', 'SW'],
    ['Quick-Dry Rash Guard', 'QR'],
    ["Tideline 6'0\" Performance Shortboard", 'TP'],
    ['wax', 'W'],
    ['3 Pack', 'P'],
    ['', ''],
  ])('%s → %s', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
