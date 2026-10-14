import type { Core } from '@strapi/strapi';
import { LOCKED_FIELDS } from '../api/order/order-guard';

/**
 * The Order edit view in the admin: the fields the order store owns are greyed out, and
 * IdempotencyKey is hidden. Like the Product layout (catalog.ts), the view lives in the
 * content-manager configuration in the DB, so it is enforced here on every boot.
 * order-guard.ts enforces the same rule server-side.
 */

const ORDER_CONFIG_KEY = 'configuration_content_types::api::order.order';
const ORDER_LINE_CONFIG_KEY = 'configuration_components::order.line';
const HIDDEN = 'IdempotencyKey';

type LayoutField = { name: string; size: number };
type EditMeta = { visible?: boolean; editable?: boolean; [key: string]: unknown };
type OrderViewConfig = {
  layouts: { edit: LayoutField[][]; [key: string]: unknown };
  metadatas: Record<string, { edit?: EditMeta; [key: string]: unknown }>;
  [key: string]: unknown;
};

/** The locked view, or null when nothing needs to change (or there's no config yet). */
export function lockOrderEditView(config: OrderViewConfig | null): OrderViewConfig | null {
  if (!config?.metadatas || !config.layouts?.edit) return null;

  const metadatas = { ...config.metadatas };
  for (const field of LOCKED_FIELDS) {
    const meta = metadatas[field];
    if (!meta?.edit) continue;
    metadatas[field] = { ...meta, edit: { ...meta.edit, editable: false, ...(field === HIDDEN ? { visible: false } : {}) } };
  }
  const edit = config.layouts.edit
    .map((row) => row.filter((field) => field.name !== HIDDEN))
    .filter((row) => row.length > 0);

  const next = { ...config, layouts: { ...config.layouts, edit }, metadatas };
  return JSON.stringify(next) === JSON.stringify(config) ? null : next;
}

/**
 * Every field inside an order line. Making `Lines` non-editable on the Order greys out its
 * add / delete controls but not the fields of each line, which come from the component's own
 * view. order.line is only used by Order.
 */
export function lockOrderLineView(config: OrderViewConfig | null): OrderViewConfig | null {
  if (!config?.metadatas) return null;

  const metadatas = Object.fromEntries(
    Object.entries(config.metadatas).map(([field, meta]) => [field, meta?.edit ? { ...meta, edit: { ...meta.edit, editable: false } } : meta])
  );
  const next = { ...config, metadatas };
  return JSON.stringify(next) === JSON.stringify(config) ? null : next;
}

/**
 * Orders are only created at checkout, so "Create new entry" is removed from the admin by
 * deleting the content-manager create permission on Order (Strapi re-grants the Super Admin
 * every permission on boot, so this runs after it, on every boot). The guard still rejects a
 * create that gets through.
 */
export async function removeOrderCreatePermissions(strapi: Core.Strapi): Promise<number> {
  const { count } = await strapi.db.query('admin::permission').deleteMany({
    where: { action: 'plugin::content-manager.explorer.create', subject: 'api::order.order' },
  });
  return count;
}

export async function setupOrderAdmin(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'plugin', name: 'content_manager' });
  for (const [key, lock] of [
    [ORDER_CONFIG_KEY, lockOrderEditView],
    [ORDER_LINE_CONFIG_KEY, lockOrderLineView],
  ] as const) {
    const next = lock((await store.get({ key })) as OrderViewConfig | null);
    if (next) await store.set({ key, value: next });
  }
  await removeOrderCreatePermissions(strapi);
}
