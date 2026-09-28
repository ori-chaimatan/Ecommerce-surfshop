import { errors } from '@strapi/utils';

/**
 * Keeps a product's Subcategories inside its main Category: every selected
 * Subcategory's Category must equal the product's Category, or the save is
 * rejected with a ValidationError (400 over REST, an error toast in the admin).
 *
 * On update Strapi 5 sends relation *operations* (connect / disconnect / set),
 * not the full list, so the final state is rebuilt from the stored relations
 * plus the operations before comparing — including a Category change against
 * the Subcategories the product already has.
 */

const PRODUCT_UID = 'api::product.product';
const CATEGORY_UID = 'api::category.category';
const SUBCATEGORY_UID = 'api::subcategory.subcategory';

type RelationRef = number | string | { id?: number | string; documentId?: string };
type RelationInput =
  | RelationRef
  | RelationRef[]
  | { set?: RelationRef[]; connect?: RelationRef[]; disconnect?: RelationRef[] }
  | null
  | undefined;

interface LifecycleEvent {
  params: { data?: Record<string, unknown>; where?: Record<string, unknown> };
}

function isRef(value: unknown): value is RelationRef {
  return (
    typeof value === 'number' ||
    typeof value === 'string' ||
    (typeof value === 'object' && value !== null && ('id' in value || 'documentId' in value))
  );
}

function asOperations(input: RelationInput) {
  if (input === null) return { set: [] as RelationRef[] };
  if (Array.isArray(input)) return { set: input };
  if (isRef(input)) return { set: [input] };
  const ops = (input ?? {}) as { set?: RelationRef[]; connect?: RelationRef[]; disconnect?: RelationRef[] };
  return { set: ops.set, connect: ops.connect ?? [], disconnect: ops.disconnect ?? [] };
}

async function toIds(uid: string, refs: RelationRef[] = []): Promise<number[]> {
  const ids: number[] = [];
  for (const ref of refs) {
    const raw = typeof ref === 'object' ? ref.id ?? undefined : ref;
    const documentId = typeof ref === 'object' ? ref.documentId : undefined;

    if (raw !== undefined && !Number.isNaN(Number(raw))) {
      ids.push(Number(raw));
    } else if (documentId || typeof raw === 'string') {
      const row = await strapi.db.query(uid as never).findOne({ where: { documentId: documentId ?? raw }, select: ['id'] });
      if (row) ids.push(row.id);
    }
  }
  return ids;
}

/** Applies relation operations to the current ids and returns the final ids. */
async function resolve(uid: string, current: number[], input: RelationInput): Promise<number[]> {
  const { set, connect = [], disconnect = [] } = asOperations(input);
  let ids = set ? await toIds(uid, set) : [...current];
  const removed = new Set(await toIds(uid, disconnect));
  ids = ids.filter((id) => !removed.has(id));
  for (const id of await toIds(uid, connect)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function assertSubcategoriesMatchCategory(event: LifecycleEvent, existingId?: number) {
  const data = event.params.data ?? {};
  const touchesCategory = 'Category' in data;
  const touchesSubcategories = 'Subcategories' in data;
  if (!touchesCategory && !touchesSubcategories) return;

  let currentCategory: number[] = [];
  let currentSubcategories: number[] = [];
  if (existingId !== undefined) {
    // One relation per query: this runs inside the save transaction (a single
    // connection), and populating several relations at once issues them in
    // parallel on it, which pg deprecates.
    const withCategory = await strapi.db.query(PRODUCT_UID as never).findOne({
      where: { id: existingId },
      populate: { Category: { select: ['id'] } },
    });
    const withSubcategories = await strapi.db.query(PRODUCT_UID as never).findOne({
      where: { id: existingId },
      populate: { Subcategories: { select: ['id'] } },
    });
    currentCategory = withCategory?.Category ? [withCategory.Category.id] : [];
    currentSubcategories = (withSubcategories?.Subcategories ?? []).map((s: { id: number }) => s.id);
  }

  const categoryIds = touchesCategory
    ? await resolve(CATEGORY_UID, currentCategory, data.Category as RelationInput)
    : currentCategory;
  const subcategoryIds = touchesSubcategories
    ? await resolve(SUBCATEGORY_UID, currentSubcategories, data.Subcategories as RelationInput)
    : currentSubcategories;

  if (subcategoryIds.length === 0) return;

  // Filter through the relation in WHERE instead of populating it: populate runs
  // its queries in parallel on the transaction's single connection, which pg
  // deprecates. Every query here is awaited one at a time.
  const categoryId = categoryIds[categoryIds.length - 1];
  const mismatched: { id: number; Name: string }[] = await strapi.db.query(SUBCATEGORY_UID as never).findMany({
    where: {
      id: { $in: subcategoryIds },
      ...(categoryId ? { $or: [{ Category: { id: { $ne: categoryId } } }, { Category: { id: { $null: true } } }] } : {}),
    },
    select: ['id', 'Name'],
  });

  if (mismatched.length > 0) {
    const category = categoryId
      ? await strapi.db.query(CATEGORY_UID as never).findOne({ where: { id: categoryId }, select: ['Name'] })
      : null;
    const parts: string[] = [];
    for (const subcategory of mismatched) {
      const owner = await strapi.db
        .query(CATEGORY_UID as never)
        .findOne({ where: { Subcategories: { id: subcategory.id } }, select: ['Name'] });
      parts.push(`"${subcategory.Name}" (belongs to ${owner?.Name ?? 'no category'})`);
    }
    const list = parts.join(', ');
    throw new errors.ValidationError(
      `Subcategories must belong to the product's Category${category ? ` "${category.Name}"` : ''}: ${list}.`
    );
  }
}

export default {
  async beforeCreate(event: LifecycleEvent) {
    await assertSubcategoriesMatchCategory(event);
  },

  async beforeUpdate(event: LifecycleEvent) {
    const id = event.params.where?.id;
    const existingId = typeof id === 'number' || typeof id === 'string' ? Number(id) : undefined;
    await assertSubcategoriesMatchCategory(event, existingId);
  },
};
