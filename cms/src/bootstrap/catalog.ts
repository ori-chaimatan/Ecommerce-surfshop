import type { Core } from '@strapi/strapi';
import { grantPublicActions } from './public-permissions';

const PUBLIC_ACTIONS = [
  'api::product.product.find',
  'api::product.product.findOne',
  'api::category.category.find',
  'api::category.category.findOne',
  'api::subcategory.subcategory.find',
  'api::subcategory.subcategory.findOne',
];

type LayoutField = { name: string; size: number };

// The admin edit view is stored in the DB (content-manager configuration), not in schema.json,
// so the field order is enforced here on every boot.
const PRODUCT_LAYOUT_KEY = 'configuration_content_types::api::product.product';
const BOARD_SIZE_LAYOUT_KEY = 'configuration_components::product.board-size';
// SizeType drives which size component is visible, so it leads the size block right after Featured.
const PRODUCT_SIZE_ROWS: LayoutField[][] = [[{ name: 'SizeType', size: 6 }], [{ name: 'BoardSizes', size: 12 }], [{ name: 'StandardSizes', size: 12 }]];
const BOARD_SIZE_ROWS: LayoutField[][] = [
  [
    { name: 'LengthFt', size: 4 },
    { name: 'LengthInches', size: 4 },
    { name: 'VolumeL', size: 4 },
  ],
  [{ name: 'Stock', size: 4 }],
];

type EditConfig = { layouts?: { edit?: LayoutField[][] } };

async function updateEditLayout(strapi: Core.Strapi, key: string, build: (edit: LayoutField[][]) => LayoutField[][] | null) {
  const store = strapi.store({ type: 'plugin', name: 'content_manager' });
  const config = (await store.get({ key })) as EditConfig | null;
  const edit = config?.layouts?.edit;
  if (!config || !edit) return;

  const next = build(edit);
  if (!next || JSON.stringify(next) === JSON.stringify(edit)) return;
  await store.set({ key, value: { ...config, layouts: { ...config.layouts, edit: next } } });
}

/** Product edit view: SizeType, BoardSizes and StandardSizes directly after the row holding Featured. */
function productEditLayout(edit: LayoutField[][]) {
  const sizeNames = PRODUCT_SIZE_ROWS.flat().map((field) => field.name);
  const rows = edit.map((row) => row.filter((field) => !sizeNames.includes(field.name))).filter((row) => row.length > 0);
  const featuredRow = rows.findIndex((row) => row.some((field) => field.name === 'Featured'));
  if (featuredRow === -1) return null;
  return [...rows.slice(0, featuredRow + 1), ...PRODUCT_SIZE_ROWS, ...rows.slice(featuredRow + 1)];
}

/** Board size: feet, inches and volume on one row, stock below. Only once the stored fields match. */
function boardSizeEditLayout(edit: LayoutField[][]) {
  const stored = edit.flat().map((field) => field.name).sort();
  const wanted = BOARD_SIZE_ROWS.flat().map((field) => field.name).sort();
  return JSON.stringify(stored) === JSON.stringify(wanted) ? BOARD_SIZE_ROWS : null;
}

export async function setupCatalog(strapi: Core.Strapi) {
  await grantPublicActions(strapi, PUBLIC_ACTIONS, 'catalog');
  await updateEditLayout(strapi, PRODUCT_LAYOUT_KEY, productEditLayout);
  await updateEditLayout(strapi, BOARD_SIZE_LAYOUT_KEY, boardSizeEditLayout);
}
