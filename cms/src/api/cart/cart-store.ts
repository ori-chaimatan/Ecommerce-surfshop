import { randomUUID } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import {
  CartError,
  addLine,
  mergeLines,
  removeLine,
  revalidate,
  setLineQty,
  toCartResponse,
  type CartProduct,
  type CartResponse,
  type LineRef,
  type PopulatedLine,
} from './cart-logic';

export const CART_UID = 'api::cart.cart';
export const PRODUCT_UID = 'api::product.product';

/** Who the request is for: a signed-in user, a guest with a cart token, or neither. */
export type CartIdentity =
  | { kind: 'user'; userId: number; userDocumentId: string; email?: string }
  | { kind: 'guest'; token: string }
  | { kind: 'none' };

const PRODUCT_POPULATE = { Images: true, BoardSizes: true, StandardSizes: true } as const;
const CART_POPULATE = { Lines: { populate: { Product: { populate: PRODUCT_POPULATE } } } } as const;

/**
 * Carts and products are read with `status: 'published'`, so a product that only exists
 * as a draft populates as null and its line is pruned like a deleted one.
 */
const PUBLISHED = 'published' as const;

interface StoredLine {
  Product: CartProduct | null;
  SizeKey: string;
  Quantity: number;
}

interface StoredCart {
  documentId: string;
  Lines?: StoredLine[] | null;
}

const EMPTY: CartResponse = { lines: [], removedCount: 0 };

/** Guest carts live as long as their `westline_cart` cookie (30 days); older ones are abandoned. */
const ABANDONED_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const PURGE_BATCH = 100;

export const abandonedCutoff = (now: Date) => new Date(now.getTime() - ABANDONED_AFTER_MS);

const toPopulated = (cart: StoredCart | null): PopulatedLine[] =>
  (cart?.Lines ?? []).map((line) => ({ product: line.Product ?? null, sizeKey: line.SizeKey, quantity: line.Quantity }));

const toStored = (lines: LineRef[]) =>
  lines.map((line) => ({ Product: line.productDocumentId, SizeKey: line.sizeKey, Quantity: line.quantity }));

function cartFilters(identity: CartIdentity) {
  if (identity.kind === 'user') return { User: { id: identity.userId } };
  if (identity.kind === 'guest') return { Token: identity.token, User: { id: { $null: true } } };
  return null;
}

export function createCartStore(strapi: Core.Strapi, newToken: () => string = randomUUID) {
  const carts = () => strapi.documents(CART_UID as never) as unknown as {
    findFirst(params: object): Promise<StoredCart | null>;
    findMany(params: object): Promise<{ documentId: string }[]>;
    create(params: object): Promise<StoredCart>;
    update(params: object): Promise<StoredCart>;
    delete(params: object): Promise<unknown>;
  };
  const products = () => strapi.documents(PRODUCT_UID as never) as unknown as {
    findOne(params: object): Promise<CartProduct | null>;
  };

  async function find(identity: CartIdentity): Promise<StoredCart | null> {
    const filters = cartFilters(identity);
    if (!filters) return null;
    return carts().findFirst({ filters, populate: CART_POPULATE, status: PUBLISHED });
  }

  async function findProduct(documentId: string): Promise<CartProduct> {
    const product = await products().findOne({ documentId, populate: PRODUCT_POPULATE, status: PUBLISHED });
    if (!product) throw new CartError('not-found', 'This product does not exist.');
    return product;
  }

  async function writeLines(documentId: string, lines: LineRef[]) {
    await carts().update({ documentId, data: { Lines: toStored(lines) }, status: PUBLISHED });
  }

  /** Reads and re-validates the cart, writing back any pruned or clamped lines. */
  async function read(identity: CartIdentity, token?: string): Promise<CartResponse> {
    const cart = await find(identity);
    if (!cart) return token ? { ...EMPTY, token } : EMPTY;

    const result = revalidate(toPopulated(cart));
    if (result.changed) await writeLines(cart.documentId, result.refs);
    return toCartResponse(result.lines, result.removedCount, token);
  }

  /** The cart's lines as stored refs, after dropping lines whose product is gone. */
  const currentRefs = (cart: StoredCart | null) => revalidate(toPopulated(cart)).refs;

  async function add(identity: CartIdentity, { productDocumentId, sizeKey }: Omit<LineRef, 'quantity'>) {
    const product = await findProduct(productDocumentId);
    const cart = await find(identity);
    const lines = addLine(currentRefs(cart), product, sizeKey);

    if (cart) {
      await writeLines(cart.documentId, lines);
      return read(identity);
    }

    if (identity.kind === 'user') {
      await carts().create({ data: { User: identity.userDocumentId, Lines: toStored(lines) } });
      return read(identity);
    }

    const token = newToken();
    await carts().create({ data: { Token: token, Lines: toStored(lines) } });
    return read({ kind: 'guest', token }, token);
  }

  async function setQuantity(identity: CartIdentity, { productDocumentId, sizeKey, quantity }: LineRef) {
    const cart = await find(identity);
    if (!cart) throw new CartError('not-found', 'This item is not in the cart.');

    const product = await findProduct(productDocumentId);
    await writeLines(cart.documentId, setLineQty(currentRefs(cart), product, sizeKey, quantity));
    return read(identity);
  }

  async function remove(identity: CartIdentity, { productDocumentId, sizeKey }: Omit<LineRef, 'quantity'>) {
    const cart = await find(identity);
    if (!cart) return EMPTY;

    await writeLines(cart.documentId, removeLine(currentRefs(cart), productDocumentId, sizeKey));
    return read(identity);
  }

  /**
   * Moves a guest cart into the user's: lines summed and clamped, then the guest cart is
   * deleted. When the user has no cart yet, the guest cart itself becomes theirs.
   */
  async function merge(user: Extract<CartIdentity, { kind: 'user' }>, guestToken: string) {
    const userCart = await find(user);
    const guestCart = await find({ kind: 'guest', token: guestToken });

    if (guestCart && userCart) {
      await writeLines(userCart.documentId, mergeLines(toPopulated(userCart), toPopulated(guestCart)));
      await carts().delete({ documentId: guestCart.documentId });
    } else if (guestCart) {
      await carts().update({
        documentId: guestCart.documentId,
        data: { Token: null, User: user.userDocumentId, Lines: toStored(mergeLines([], toPopulated(guestCart))) },
        status: PUBLISHED,
      });
    }

    return read(user);
  }

  /** The cart's document id, for checkout to lock and clear it. */
  async function findId(identity: CartIdentity): Promise<string | null> {
    return (await find(identity))?.documentId ?? null;
  }

  /** Empties a cart after its order is placed (runs inside the place-order transaction). */
  async function clearLines(documentId: string) {
    await writeLines(documentId, []);
  }

  /**
   * Deletes guest carts (no User) not updated since the cutoff, in batches, through the
   * document service so their line components go too. User carts are never touched.
   */
  async function purgeAbandoned(now: Date, batchSize = PURGE_BATCH): Promise<number> {
    const filters = { User: { id: { $null: true } }, updatedAt: { $lt: abandonedCutoff(now).toISOString() } };
    let deleted = 0;

    for (;;) {
      const batch = await carts().findMany({ filters, fields: ['documentId'], limit: batchSize });
      for (const { documentId } of batch) await carts().delete({ documentId });
      deleted += batch.length;
      if (batch.length < batchSize) return deleted;
    }
  }

  return { read, add, setQuantity, remove, merge, findId, clearLines, purgeAbandoned };
}

export type CartStore = ReturnType<typeof createCartStore>;
