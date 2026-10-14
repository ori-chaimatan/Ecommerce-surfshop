import { describe, expect, it, vi } from 'vitest';
import type { OrderResponse } from '../../src/api/order/order-logic';
import { buildOrderEmail, sendOrderEmail } from '../../src/api/order/order-email';

const order: OrderResponse = {
  orderNumber: 'WL-104233',
  status: 'processing',
  email: 'jamie@example.com',
  placedAt: '2026-10-11T12:00:00.000Z',
  shippingMethod: 'express',
  shippingAddress: {
    firstName: 'Jamie',
    lastName: '<b>Rivera</b>',
    address1: '1 Ocean Ave',
    address2: 'Apt 2',
    city: 'Santa Cruz',
    state: 'CA',
    postalCode: '95060',
    country: 'US',
    phone: null,
  },
  lines: [
    { productDocumentId: 'board-1', name: 'CI Pro', slug: 'ci-pro', sizeKey: '6-0-29.4', sizeLabel: `6'0" · 29.4L`, unitPrice: 829, quantity: 1, lineTotal: 829, imageUrl: null, imageAlt: null },
    { productDocumentId: 'shorts-1', name: 'Samurai', slug: 'samurai', sizeKey: 'M', sizeLabel: 'M', unitPrice: 39.99, quantity: 2, lineTotal: 79.98, imageUrl: null, imageAlt: null },
  ],
  subtotal: 908.98,
  shippingCost: 25,
  total: 933.98,
  currency: 'USD',
  payment: { brand: 'visa', last4: '4242' },
};

describe('order confirmation email (AC16)', () => {
  const email = buildOrderEmail(order, 'http://localhost:3000');

  it('is addressed to the order email with the order number in the subject', () => {
    expect(email.to).toBe('jamie@example.com');
    expect(email.subject).toBe('Your WESTLINE order WL-104233');
  });

  it('lists lines, size labels, quantities and totals', () => {
    expect(email.html).toContain('CI Pro');
    expect(email.html).toContain('6&#39;0&quot; · 29.4L');
    expect(email.html).toContain('Samurai');
    expect(email.html).toContain('Qty 2');
    expect(email.html).toContain('$79.98');
    expect(email.html).toContain('Subtotal');
    expect(email.html).toContain('$908.98');
    expect(email.html).toContain('$25');
    expect(email.html).toContain('$933.98');
  });

  it('shows the address and the shipping method with its ETA', () => {
    expect(email.html).toContain('1 Ocean Ave');
    expect(email.html).toContain('Apt 2');
    expect(email.html).toContain('Santa Cruz, CA 95060');
    expect(email.html).toContain('Express Shipping');
    expect(email.html).toContain('2–3 business days');
  });

  it('links to the confirmation page', () => {
    expect(email.html).toContain('href="http://localhost:3000/checkout/confirmation/WL-104233"');
  });

  it('escapes shopper-entered text', () => {
    expect(email.html).not.toContain('<b>Rivera</b>');
    expect(email.html).toContain('&lt;b&gt;Rivera&lt;/b&gt;');
  });

  it('shows the card as brand and last 4 only', () => {
    expect(email.html).toContain('Visa •••• 4242');
  });

  it('logs a failed send and never rejects', async () => {
    const error = vi.fn();
    const strapi = {
      plugin: () => ({ service: () => ({ send: vi.fn().mockRejectedValue(new Error('smtp down')) }) }),
      log: { error },
    };
    await expect(sendOrderEmail(strapi as never, order, 'http://localhost:3000')).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith('[order email] failed to send WL-104233', expect.any(Error));
  });

  it('sends through the email plugin', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const strapi = { plugin: () => ({ service: () => ({ send }) }), log: { error: vi.fn() } };
    await sendOrderEmail(strapi as never, order, 'http://localhost:3000');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'jamie@example.com', subject: 'Your WESTLINE order WL-104233' }));
  });
});
