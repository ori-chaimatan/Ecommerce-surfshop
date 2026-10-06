import { errors } from '@strapi/utils';

/**
 * Validates a product's taxonomy on every save, rejecting it with a
 * ValidationError (400 over REST, an error toast in the admin) when:
 *   - a selected Subcategory belongs to a Category other than the product's, or
 *   - the Category is Clothing and Gender is empty, or the Category is anything
 *     else and Gender is set, or
 *   - the sizes break the size model: Surfboards ⇔ SizeType Surfboard (everything
 *     else ⇔ Standard), only the matching component (BoardSizes / StandardSizes)
 *     has entries and it has at least one, no duplicate sizes, and OneSize alone.
 *
 * On update Strapi 5 sends relation *operations* (connect / disconnect / set),
 * not the full list, and only the fields being changed, so the final state is
 * rebuilt from the stored values plus the request before checking — including
 * a Category change against the Subcategories and Gender the product already has.
 *
 * Conditional Fields hide the non-matching size component in the admin, and Strapi
 * skips schema validation for hidden fields, so these rules are the real check.
 * Stale entries in a hidden component are cleared before this runs by the
 * clear-stale-sizes document middleware (../../documents/clear-stale-sizes.ts).
 */

const PRODUCT_UID = 'api::product.product';
const CATEGORY_UID = 'api::category.category';
const SUBCATEGORY_UID = 'api::subcategory.subcategory';
const BOARD_SIZE_UID = 'product.board-size';
const STANDARD_SIZE_UID = 'product.standard-size';
// Gender applies to this category only (Men / Women / Unisex).
const GENDERED_CATEGORY_SLUG = 'clothing';
// SizeType Surfboard (BoardSizes) applies to this category only; every other one is Standard.
const SURFBOARD_CATEGORY_SLUG = 'surfboards';
const SIZE_FIELDS = ['Category', 'SizeType', 'BoardSizes', 'StandardSizes'];

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

type BoardSize = { LengthFt: number | string; LengthInches: number | string; VolumeL: number | string };
type StandardSize = { Size: string };

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

/** `6'0" · 29.4L` — same display text the storefront builds (frontend/src/lib/strapi/sizes.ts). */
function boardSizeLabel({ LengthFt, LengthInches, VolumeL }: BoardSize) {
  return `${Number(LengthFt)}'${Number(LengthInches)}" · ${Number(VolumeL)}L`;
}

/**
 * The final entries of one size component. Components reach a db lifecycle
 * already created, as `{ id, __pivot }` refs, so their values are read back by id;
 * a component the request doesn't touch keeps its stored entries.
 */
async function sizeEntries<T>(field: string, uid: string, data: Record<string, unknown>, existingId?: number): Promise<T[]> {
  if (!(field in data)) {
    if (existingId === undefined) return [];
    const stored = await strapi.db.query(PRODUCT_UID as never).findOne({ where: { id: existingId }, select: ['id'], populate: { [field]: true } });
    return (stored?.[field] ?? []) as T[];
  }

  const items = (data[field] ?? []) as Record<string, unknown>[];
  const valueKey = uid === BOARD_SIZE_UID ? 'LengthFt' : 'Size';
  if (items.every((item) => valueKey in item)) return items as T[];

  const ids = items.map((item) => Number(item.id)).filter((id) => !Number.isNaN(id));
  if (ids.length === 0) return [];
  return (await strapi.db.query(uid as never).findMany({ where: { id: { $in: ids } } })) as T[];
}

async function assertProductSizes(
  data: Record<string, unknown>,
  category: { Name: string; Slug: string },
  storedSizeType: string | null,
  existingId?: number
) {
  const sizeType = 'SizeType' in data ? ((data.SizeType as string | null | undefined) ?? null) : storedSizeType;
  const isSurfboard = category.Slug === SURFBOARD_CATEGORY_SLUG;

  if (isSurfboard && sizeType !== 'Surfboard') {
    throw new errors.ValidationError(`"${category.Name}" products need Size type Surfboard.`);
  }
  if (!isSurfboard && sizeType !== 'Standard') {
    throw new errors.ValidationError(`"${category.Name}" products need Size type Standard; Surfboard is only for Surfboards.`);
  }

  const boardSizes = await sizeEntries<BoardSize>('BoardSizes', BOARD_SIZE_UID, data, existingId);
  const standardSizes = await sizeEntries<StandardSize>('StandardSizes', STANDARD_SIZE_UID, data, existingId);

  if (isSurfboard) {
    if (standardSizes.length > 0) {
      throw new errors.ValidationError('Standard sizes only apply to Size type Standard; remove them or change the Size type.');
    }
    if (boardSizes.length === 0) throw new errors.ValidationError('Add at least one Board size.');

    const seen = new Set<string>();
    for (const size of boardSizes) {
      const key = `${Number(size.LengthFt) * 12 + Number(size.LengthInches)}/${Number(size.VolumeL)}`;
      if (seen.has(key)) throw new errors.ValidationError(`Duplicate Board size: ${boardSizeLabel(size)}.`);
      seen.add(key);
    }
    return;
  }

  if (boardSizes.length > 0) {
    throw new errors.ValidationError('Board sizes only apply to Size type Surfboard; remove them or change the Size type.');
  }
  if (standardSizes.length === 0) throw new errors.ValidationError('Add at least one Standard size.');

  const seen = new Set<string>();
  for (const { Size } of standardSizes) {
    if (seen.has(Size)) throw new errors.ValidationError(`Duplicate Standard size: ${Size}.`);
    seen.add(Size);
  }
  if (seen.has('OneSize') && seen.size > 1) {
    const others = [...seen].filter((size) => size !== 'OneSize');
    throw new errors.ValidationError(`OneSize must be the only Standard size; remove: ${others.join(', ')}.`);
  }
}

async function assertProduct(event: LifecycleEvent, existingId?: number) {
  const data = event.params.data ?? {};
  const touchesCategory = 'Category' in data;
  const touchesSubcategories = 'Subcategories' in data;
  const touchesGender = 'Gender' in data;
  const touchesTaxonomy = touchesCategory || touchesSubcategories || touchesGender;
  const touchesSizes = SIZE_FIELDS.some((field) => field in data);
  if (!touchesTaxonomy && !touchesSizes) return;

  let currentCategory: number[] = [];
  let currentSubcategories: number[] = [];
  let currentGender: string | null = null;
  let currentSizeType: string | null = null;
  if (existingId !== undefined) {
    // One relation per query: this runs inside the save transaction (a single
    // connection), and populating several relations at once issues them in
    // parallel on it, which pg deprecates.
    const withCategory = await strapi.db.query(PRODUCT_UID as never).findOne({
      where: { id: existingId },
      select: ['id', 'Gender', 'SizeType'],
      populate: { Category: { select: ['id'] } },
    });
    const withSubcategories = await strapi.db.query(PRODUCT_UID as never).findOne({
      where: { id: existingId },
      populate: { Subcategories: { select: ['id'] } },
    });
    currentCategory = withCategory?.Category ? [withCategory.Category.id] : [];
    currentSubcategories = (withSubcategories?.Subcategories ?? []).map((s: { id: number }) => s.id);
    currentGender = withCategory?.Gender ?? null;
    currentSizeType = withCategory?.SizeType ?? null;
  }

  const categoryIds = touchesCategory
    ? await resolve(CATEGORY_UID, currentCategory, data.Category as RelationInput)
    : currentCategory;
  const subcategoryIds = touchesSubcategories
    ? await resolve(SUBCATEGORY_UID, currentSubcategories, data.Subcategories as RelationInput)
    : currentSubcategories;
  const gender = touchesGender ? ((data.Gender as string | null | undefined) ?? null) : currentGender;

  const categoryId = categoryIds[categoryIds.length - 1];
  const category: { Name: string; Slug: string } | null = categoryId
    ? await strapi.db.query(CATEGORY_UID as never).findOne({ where: { id: categoryId }, select: ['Name', 'Slug'] })
    : null;

  if (touchesTaxonomy && subcategoryIds.length > 0) {
    // Filter through the relation in WHERE instead of populating it: populate runs
    // its queries in parallel on the transaction's single connection, which pg
    // deprecates. Every query here is awaited one at a time.
    const mismatched: { id: number; Name: string }[] = await strapi.db.query(SUBCATEGORY_UID as never).findMany({
      where: {
        id: { $in: subcategoryIds },
        ...(categoryId ? { $or: [{ Category: { id: { $ne: categoryId } } }, { Category: { id: { $null: true } } }] } : {}),
      },
      select: ['id', 'Name'],
    });

    if (mismatched.length > 0) {
      const parts: string[] = [];
      for (const subcategory of mismatched) {
        const owner = await strapi.db
          .query(CATEGORY_UID as never)
          .findOne({ where: { Subcategories: { id: subcategory.id } }, select: ['Name'] });
        parts.push(`"${subcategory.Name}" (belongs to ${owner?.Name ?? 'no category'})`);
      }
      throw new errors.ValidationError(
        `Subcategories must belong to the product's Category${category ? ` "${category.Name}"` : ''}: ${parts.join(', ')}.`
      );
    }
  }

  // No Category resolved: Strapi's own required-field validation reports that.
  if (!category) return;

  if (touchesTaxonomy) {
    if (category.Slug === GENDERED_CATEGORY_SLUG && !gender) {
      throw new errors.ValidationError(`"${category.Name}" products need a Gender: Men, Women or Unisex.`);
    }
    if (category.Slug !== GENDERED_CATEGORY_SLUG && gender) {
      throw new errors.ValidationError(`Gender only applies to Clothing products; clear it for this "${category.Name}" product.`);
    }
  }

  if (touchesSizes) await assertProductSizes(data, category, currentSizeType, existingId);
}

export default {
  async beforeCreate(event: LifecycleEvent) {
    await assertProduct(event);
  },

  async beforeUpdate(event: LifecycleEvent) {
    const id = event.params.where?.id;
    const existingId = typeof id === 'number' || typeof id === 'string' ? Number(id) : undefined;
    await assertProduct(event, existingId);
  },
};
