import { errors } from '@strapi/utils';
import { hasRelationRefs, inverseWrites } from '../../../../utils/catalog-relations';

/**
 * Subcategory.Products is a read-only inverse side, and a subcategory can't move to another
 * Category while it has products in its current one: their Subcategories would no longer
 * match their Category (product-content-model AC6).
 */

const SUBCATEGORY_UID = 'api::subcategory.subcategory';
const CATEGORY_UID = 'api::category.category';
const PRODUCT_UID = 'api::product.product';

interface LifecycleEvent {
  params: { data?: Record<string, unknown>; where?: Record<string, unknown> };
}

function assertNoInverseWrites(event: LifecycleEvent) {
  if (inverseWrites(event.params.data, ['Products']).length > 0) {
    throw new errors.ValidationError("Subcategory Products can't be edited here: set a product's Subcategories on the product.");
  }
}

/** The Category id a relation input sets, or undefined when it only has empty operations. */
async function targetCategoryId(input: unknown): Promise<number | null | undefined> {
  if (!hasRelationRefs(input)) return undefined;
  if (input === null) return null;
  const ops = input as { set?: unknown[]; connect?: unknown[] };
  const ref = Array.isArray(input) ? input.at(-1) : ops.connect?.at(-1) ?? ops.set?.at(-1) ?? (ops.set ? null : input);
  if (ref === null || ref === undefined) return null;

  const raw = typeof ref === 'object' ? (ref as { id?: number | string }).id : ref;
  if (raw !== undefined && !Number.isNaN(Number(raw))) return Number(raw);
  const documentId = typeof ref === 'object' ? (ref as { documentId?: string }).documentId : (ref as string);
  const row = await strapi.db.query(CATEGORY_UID as never).findOne({ where: { documentId }, select: ['id'] });
  return row?.id ?? null;
}

async function assertCategoryMoveKeepsProducts(event: LifecycleEvent) {
  const id = event.params.where?.id;
  if (typeof id !== 'number' && typeof id !== 'string') return;
  const categoryId = await targetCategoryId(event.params.data?.Category);
  if (categoryId === undefined) return;

  // Products of this subcategory whose Category isn't the new one (one query, no populate:
  // this runs inside the save transaction).
  const stranded: { Name: string }[] = await strapi.db.query(PRODUCT_UID as never).findMany({
    where: {
      Subcategories: { id: Number(id) },
      ...(categoryId ? { $or: [{ Category: { id: { $ne: categoryId } } }, { Category: { id: { $null: true } } }] } : {}),
    },
    select: ['Name'],
    limit: 5,
  });
  if (stranded.length > 0) {
    const subcategory = await strapi.db.query(SUBCATEGORY_UID as never).findOne({ where: { id: Number(id) }, select: ['Name'] });
    throw new errors.ValidationError(
      `"${subcategory?.Name ?? 'This subcategory'}" can't change Category while products in another Category use it: ${stranded
        .map((p) => `"${p.Name}"`)
        .join(', ')}. Move or update those products first.`
    );
  }
}

export default {
  beforeCreate(event: LifecycleEvent) {
    assertNoInverseWrites(event);
  },

  async beforeUpdate(event: LifecycleEvent) {
    assertNoInverseWrites(event);
    await assertCategoryMoveKeepsProducts(event);
  },
};
