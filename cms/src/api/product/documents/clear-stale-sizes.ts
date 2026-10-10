import type { Core } from '@strapi/strapi';

/**
 * Clears the size component that doesn't match a product's SizeType when a save
 * leaves it out.
 *
 * Conditional Fields hide that component in the admin, and the admin drops hidden
 * fields from the save — so after switching SizeType the old entries would stay
 * stored, invisible, and the lifecycle hook would block every save. Setting the
 * field to [] here, on the raw document input, makes Strapi delete those component
 * rows (a db lifecycle only sees already-created component refs, too late for that).
 * Entries sent explicitly for the non-matching component are left alone, so the
 * lifecycle hook rejects them.
 */

const PRODUCT_UID = 'api::product.product';
const OTHER_SIZES = { Surfboard: 'StandardSizes', Standard: 'BoardSizes' } as const;

type SizeType = keyof typeof OTHER_SIZES;

export function registerClearStaleSizes(strapi: Core.Strapi) {
  strapi.documents.use(async (context, next) => {
    if (context.uid !== PRODUCT_UID || (context.action !== 'create' && context.action !== 'update')) {
      return next();
    }

    const params = context.params as { documentId?: string; data?: Record<string, unknown> };
    const data = params.data;
    if (!data) return next();

    let sizeType = data.SizeType as SizeType | null | undefined;
    if (sizeType === undefined && context.action === 'update' && params.documentId) {
      const stored = await strapi.db
        .query(PRODUCT_UID as never)
        .findOne({ where: { documentId: params.documentId }, select: ['SizeType'] });
      sizeType = stored?.SizeType ?? null;
    }

    const other = sizeType ? OTHER_SIZES[sizeType] : undefined;
    if (other && !(other in data)) data[other] = [];

    return next();
  });
}
