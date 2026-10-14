/**
 * Guards for the inverse catalog relations. Category.Subcategories, Category.Products and
 * Subcategory.Products are read-only (product-content-model spec): a product's Category and
 * Subcategories are set on the product, where its lifecycle checks them (AC6, AC11), and a
 * subcategory moves by changing its own Category.
 */

/**
 * True when a relation input would change the relation: a bare id / documentId, a non-empty
 * array, or `{ set, connect, disconnect }` with any entry. The admin sends empty
 * `{ connect: [], disconnect: [] }` on every save, which is not a write.
 */
export function hasRelationRefs(input: unknown): boolean {
  if (input === undefined) return false;
  if (input === null) return true;
  if (Array.isArray(input)) return input.length > 0;
  if (typeof input !== 'object') return true;
  if ('id' in input || 'documentId' in input) return true;
  const { set, connect, disconnect } = input as { set?: unknown[]; connect?: unknown[]; disconnect?: unknown[] };
  return set !== undefined || Boolean(connect?.length) || Boolean(disconnect?.length);
}

/** The inverse relations present in a save's data, for the error message. */
export function inverseWrites(data: Record<string, unknown> | undefined, fields: string[]): string[] {
  return fields.filter((field) => hasRelationRefs(data?.[field]));
}

/**
 * True when a REST `populate` (string, array or nested object) reaches `Products` or uses `*`
 * anywhere. Populating Category/Subcategory → Products is unbounded: `maxLimit` only paginates
 * the top-level list.
 */
export function populatesProducts(populate: unknown): boolean {
  if (typeof populate === 'string') {
    return populate.split(',').some((part) => part.split('.').some((name) => ['Products', '*'].includes(name.trim())));
  }
  if (Array.isArray(populate)) return populate.some(populatesProducts);
  if (populate && typeof populate === 'object') {
    return Object.entries(populate).some(([key, value]) => key === 'Products' || key === '*' || populatesProducts(value));
  }
  return false;
}
