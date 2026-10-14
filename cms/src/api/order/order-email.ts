import type { Core } from '@strapi/strapi';
import { buildEmailHtml } from '../../bootstrap/email-layout';
import { formatPrice } from './format';
import type { OrderResponse } from './order-logic';

const METHODS: Record<string, { label: string; eta: string }> = {
  standard: { label: 'Standard Shipping', eta: 'Arrives in 5–7 business days' },
  express: { label: 'Express Shipping', eta: 'Arrives in 2–3 business days' },
};
const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

const MUTED = 'color:#667085;';
const MONO = "font-family:'SFMono-Regular',Menlo,Consolas,monospace;";

/** Shopper-entered text (names, address) goes into HTML, so it is always escaped. */
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value: string | null | undefined): string {
  return (value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

const row = (label: string, value: string, strong = false) =>
  `<tr><td style="padding:4px 0;font-size:14px;${strong ? 'font-weight:700;color:#101828;' : MUTED}">${label}</td><td align="right" style="padding:4px 0;font-size:14px;${MONO}${strong ? 'font-weight:700;color:#101828;' : 'color:#101828;'}">${value}</td></tr>`;

export function buildOrderEmail(order: OrderResponse, clientUrl: string) {
  const method = METHODS[order.shippingMethod] ?? { label: order.shippingMethod, eta: '' };
  const address = order.shippingAddress;
  const confirmationUrl = `${clientUrl}/checkout/confirmation/${encodeURIComponent(order.orderNumber)}`;

  const lines = order.lines
    .map(
      (line) => `<tr>
                <td style="padding:10px 0;border-bottom:1px solid #D0D5DD;font-size:14px;color:#101828;">
                  <div style="font-weight:700;">${escapeHtml(line.name)}</div>
                  <div style="font-size:12px;${MUTED}">${escapeHtml(line.sizeLabel)}${line.quantity > 1 ? ` · Qty ${line.quantity}` : ''}</div>
                </td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid #D0D5DD;font-size:14px;${MONO}color:#101828;">${formatPrice(line.lineTotal)}</td>
              </tr>`
    )
    .join('');

  const html = buildEmailHtml(`<h1 style="font-size:24px;font-weight:800;color:#101828;margin:0 0 12px;line-height:1.3;">Thank you for your order!</h1>
            <p style="font-size:14px;line-height:1.6;${MUTED}margin:0 0 20px;">Your order <strong style="${MONO}color:#101828;">${escapeHtml(order.orderNumber)}</strong> has been placed successfully.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines}</table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;">
              ${row('Subtotal', formatPrice(order.subtotal))}
              ${row(`Shipping (${method.label})`, order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost))}
              ${row('Total Paid', formatPrice(order.total), true)}
            </table>
            <p style="font-size:14px;line-height:1.6;color:#101828;margin:0 0 4px;font-weight:700;">Ship to</p>
            <p style="font-size:14px;line-height:1.6;${MUTED}margin:0 0 16px;">${escapeHtml(address.firstName)} ${escapeHtml(address.lastName)}<br>${escapeHtml(address.address1)}${address.address2 ? `<br>${escapeHtml(address.address2)}` : ''}<br>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</p>
            <p style="font-size:14px;line-height:1.6;color:#101828;margin:0 0 4px;font-weight:700;">${method.label}</p>
            <p style="font-size:14px;line-height:1.6;${MUTED}margin:0 0 16px;">${method.eta}</p>
            <p style="font-size:14px;line-height:1.6;color:#101828;margin:0 0 4px;font-weight:700;">Payment</p>
            <p style="font-size:14px;line-height:1.6;${MUTED}margin:0 0 28px;">${BRANDS[order.payment.brand] ?? order.payment.brand} •••• ${escapeHtml(order.payment.last4)}</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:9px;background-color:#155EEF;">
                  <a href="${confirmationUrl}" style="display:inline-block;padding:15px 32px;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:#FFFFFF;text-decoration:none;">View Your Order</a>
                </td>
              </tr>
            </table>`);

  return { to: order.email, subject: `Your WESTLINE order ${order.orderNumber}`, html };
}

/** Sends the confirmation after the order is committed. A failed send is logged, never thrown. */
export async function sendOrderEmail(
  strapi: Core.Strapi,
  order: OrderResponse,
  clientUrl: string = process.env.CLIENT_URL || 'http://localhost:3000'
) {
  try {
    await strapi.plugin('email').service('email').send(buildOrderEmail(order, clientUrl));
  } catch (error) {
    strapi.log.error(`[order email] failed to send ${order.orderNumber}`, error);
  }
}
