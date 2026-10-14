import type { Core } from '@strapi/strapi';
import { findSize, type CartProduct } from '../cart/cart-logic';
import type { CartIdentity, CartStore } from '../cart/cart-store';
import { charge } from './mock-payment';
import { asOrderStore } from './order-guard';
import {
  OrderError,
  buildOrderSnapshot,
  compareWithExpected,
  lineKey,
  orderNumber,
  toOrderResponse,
  type OrderResponse,
  type PlaceOrderInput,
  type StoredOrder,
} from './order-logic';

export const ORDER_UID = 'api::order.order';
const PRODUCT_UID = 'api::product.product';
const CART_UID = 'api::cart.cart';
const SIZE_UIDS = { Surfboard: 'product.board-size', Standard: 'product.standard-size' } as const;

const ORDER_POPULATE = { ShippingAddress: true, Lines: true } as const;
const ORDER_NUMBER = /^WL-\d{6}$/;
const MAX_NUMBER_TRIES = 5;

type UserIdentity = Extract<CartIdentity, { kind: 'user' }>;

interface Deps {
  cartStore: Pick<CartStore, 'read' | 'findId' | 'clearLines'>;
  now?: () => Date;
  nextNumber?: () => number;
  newReference?: () => string;
}

/** Product as read inside the transaction: size components carry their row ids. */
type SizedProduct = CartProduct & {
  BoardSizes?: (NonNullable<CartProduct['BoardSizes']>[number] & { id: number })[] | null;
  StandardSizes?: (NonNullable<CartProduct['StandardSizes']>[number] & { id: number })[] | null;
};

export interface PlaceResult {
  /** True when this idempotency key already placed an order; nothing was charged again. */
  replayed: boolean;
  order: OrderResponse;
}

/**
 * Places and reads orders. `place` runs one DB transaction:
 *   lock the cart row → re-check the idempotency key → re-validate the cart against the review
 *   → conditionally decrement each size's stock → mock charge → create the Order → empty the cart.
 * Any failure rolls the whole thing back, so stock only moves for a created order.
 *
 * Known limitation: the mock charge runs inside the transaction. A real gateway must charge
 * outside it, with a compensating refund if the commit then fails (see the spec).
 */
export function createOrderStore(strapi: Core.Strapi, deps: Deps) {
  const now = deps.now ?? (() => new Date());
  const nextNumber = deps.nextNumber;
  const orders = () => strapi.documents(ORDER_UID as never) as unknown as {
    findFirst(params: object): Promise<StoredOrder | null>;
    create(params: object): Promise<StoredOrder>;
  };

  const findByKey = (user: UserIdentity, key: string) =>
    orders().findFirst({ filters: { IdempotencyKey: key, User: { id: user.userId } }, populate: ORDER_POPULATE });

  /** Locks the cart row so two placements for the same cart run one after the other. */
  async function lockCart(trx: unknown, cartDocumentId: string) {
    const meta = strapi.db.metadata.get(CART_UID as never) as { tableName: string; attributes: Record<string, { columnName?: string }> };
    const column = meta.attributes.documentId?.columnName ?? 'document_id';
    await strapi.db
      .connection(meta.tableName)
      .transacting(trx as never)
      .where({ [column]: cartDocumentId })
      .forUpdate()
      .select('id');
  }

  /** `UPDATE … SET stock = stock - q WHERE id = ? AND stock >= q` for each line; returns keys that couldn't be decremented. */
  async function decrementStock(trx: unknown, lines: { productDocumentId: string; sizeKey: string; quantity: number }[]) {
    const failed: string[] = [];

    for (const line of lines) {
      const product = (await strapi.db.query(PRODUCT_UID as never).findOne({
        where: { documentId: line.productDocumentId },
        populate: { BoardSizes: true, StandardSizes: true },
      })) as SizedProduct | null;
      const size = product ? (findSize(product, line.sizeKey) as { id: number } | null) : null;
      if (!product || !size) {
        failed.push(lineKey(line.productDocumentId, line.sizeKey));
        continue;
      }

      const meta = strapi.db.metadata.get(SIZE_UIDS[product.SizeType] as never) as {
        tableName: string;
        attributes: Record<string, { columnName?: string }>;
      };
      const stock = meta.attributes.Stock?.columnName ?? 'stock';
      const affected = await strapi.db
        .connection(meta.tableName)
        .transacting(trx as never)
        .where({ id: size.id })
        .andWhere(stock, '>=', line.quantity)
        .decrement(stock, line.quantity);
      if (Number(affected) !== 1) failed.push(lineKey(line.productDocumentId, line.sizeKey));
    }

    return failed;
  }

  async function freeOrderNumber() {
    for (let i = 0; i < MAX_NUMBER_TRIES; i += 1) {
      const candidate = orderNumber(nextNumber?.());
      if (!(await orders().findFirst({ filters: { OrderNumber: candidate } }))) return candidate;
    }
    throw new Error('Could not allocate a free order number.');
  }

  async function place(user: UserIdentity, input: PlaceOrderInput): Promise<PlaceResult> {
    const existing = await findByKey(user, input.idempotencyKey);
    if (existing) return { replayed: true, order: toOrderResponse(existing) };

    const cartDocumentId = await deps.cartStore.findId(user);
    if (!cartDocumentId) throw new OrderError('cart-empty', 'Your cart is empty.');

    // Strapi types the result as a nested promise; awaiting unwraps it.
    const result: PlaceResult = await strapi.db.transaction(async ({ trx }): Promise<PlaceResult> => {
      await lockCart(trx, cartDocumentId);

      const placed = await findByKey(user, input.idempotencyKey);
      if (placed) return { replayed: true, order: toOrderResponse(placed) };

      const cart = await deps.cartStore.read(user);
      const totals = compareWithExpected(cart, input.expected, input.shippingMethod);

      const soldOut = await decrementStock(trx, cart.lines);
      if (soldOut.length > 0) {
        throw new OrderError('cart-changed', 'Some items just sold out. Review your cart and try again.', undefined, soldOut);
      }

      const payment = charge(input.card, deps.newReference);
      if (payment.outcome === 'declined') throw new OrderError('card-declined', 'Your card was declined. Try another card.');
      if (payment.outcome === 'error') throw new OrderError('payment-error', "We couldn't process your payment. Try again.");

      const data = buildOrderSnapshot({
        orderNumber: await freeOrderNumber(),
        user: { documentId: user.userDocumentId, email: user.email ?? '' },
        cart,
        input,
        totals,
        payment,
        now: now(),
      });
      // As the order store, so the order guard (admin read-only rule) lets the create through.
      const created = await asOrderStore(() => orders().create({ data, populate: ORDER_POPULATE }));

      await deps.cartStore.clearLines(cartDocumentId);
      return { replayed: false, order: toOrderResponse(created) };
    });
    return result;
  }

  /** The order for its owner only; anything else (unknown, someone else's, malformed) is null. */
  async function findByNumber(user: UserIdentity, number: string): Promise<OrderResponse | null> {
    if (!ORDER_NUMBER.test(number)) return null;
    const order = await orders().findFirst({ filters: { OrderNumber: number, User: { id: user.userId } }, populate: ORDER_POPULATE });
    return order ? toOrderResponse(order) : null;
  }

  return { place, findByNumber };
}

export type OrderStore = ReturnType<typeof createOrderStore>;
