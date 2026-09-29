/**
 * Seeds the design catalog (categories, subcategories, products) from seed/catalog/catalog.json.
 *
 *   npm run seed:catalog
 *
 * Create-only: any category, subcategory or product whose Slug already exists is skipped
 * untouched, so edits made in the admin always survive a re-run. Safe to run
 * while `strapi develop` is up — both just talk to the same database.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');
const sharp = require('sharp');

const SEED_DIR = path.join(__dirname, '..', 'seed', 'catalog');
const CATEGORY_UID = 'api::category.category';
const SUBCATEGORY_UID = 'api::subcategory.subcategory';
const PRODUCT_UID = 'api::product.product';
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

function escapeXml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

// Visibly-fake product image: the product name on WESTLINE ink/horizon, so it's
// obvious in the admin which images still need a real photo.
async function renderPlaceholder(name, slug) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <rect width="100%" height="100%" fill="#101828"/>
    <rect y="1000" width="100%" height="200" fill="#155EEF"/>
    <text x="600" y="560" text-anchor="middle" font-family="Poppins, Helvetica, Arial, sans-serif" font-size="56" font-weight="800" fill="#FFFFFF">${escapeXml(name.toUpperCase())}</text>
    <text x="600" y="640" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" fill="#94A3B8">PLACEHOLDER IMAGE</text>
    <text x="600" y="1115" text-anchor="middle" font-family="Poppins, Helvetica, Arial, sans-serif" font-size="48" font-weight="800" fill="#F5F9FA">WESTLINE</text>
  </svg>`;
  const filepath = path.join(os.tmpdir(), `${slug}-placeholder.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(filepath);
  return filepath;
}

async function uploadImage(strapi, filepath, name) {
  const [file] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name, alternativeText: '' } },
    files: {
      filepath,
      originalFilename: path.basename(filepath),
      mimetype: MIME[path.extname(filepath).toLowerCase()] ?? 'image/jpeg',
      size: fs.statSync(filepath).size,
    },
  });
  return file.id;
}

async function productImageIds(strapi, product) {
  if (product.images) {
    const dir = path.join(SEED_DIR, product.images);
    const files = fs.readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()]).sort();
    const ids = [];
    for (const [i, file] of files.entries()) {
      ids.push(await uploadImage(strapi, path.join(dir, file), `${product.Slug}-${i + 1}${path.extname(file)}`));
    }
    return ids;
  }
  const placeholder = await renderPlaceholder(product.Name, product.Slug);
  try {
    return [await uploadImage(strapi, placeholder, `${product.Slug}-placeholder.jpg`)];
  } finally {
    fs.rmSync(placeholder, { force: true });
  }
}

async function seedBySlug(strapi, uid, label, entries, toData, summary) {
  const idsBySlug = {};
  for (const entry of entries) {
    const existing = await strapi.documents(uid).findFirst({ filters: { Slug: entry.Slug } });
    if (existing) {
      idsBySlug[entry.Slug] = existing.documentId;
      summary.skipped.push(`${label} ${entry.Slug}`);
      continue;
    }
    const created = await strapi.documents(uid).create({ data: toData(entry) });
    idsBySlug[entry.Slug] = created.documentId;
    summary.created.push(`${label} ${entry.Slug}`);
  }
  return idsBySlug;
}

function lookup(idsBySlug, slug, owner) {
  const id = idsBySlug[slug];
  if (!id) throw new Error(`${owner}: unknown slug "${slug}"`);
  return id;
}

async function seedProducts(strapi, products, categoryIds, subcategoryIds, summary) {
  for (const product of products) {
    const existing = await strapi.documents(PRODUCT_UID).findFirst({ filters: { Slug: product.Slug } });
    if (existing) {
      summary.skipped.push(`product ${product.Slug}`);
      continue;
    }

    const owner = `Product ${product.Slug}`;
    const categoryId = lookup(categoryIds, product.CategorySlug, owner);
    const subcategories = (product.SubcategorySlugs ?? []).map((slug) => lookup(subcategoryIds, slug, owner));

    await strapi.documents(PRODUCT_UID).create({
      data: {
        Name: product.Name,
        Slug: product.Slug,
        Category: categoryId,
        Subcategories: subcategories,
        Price: product.Price,
        Images: await productImageIds(strapi, product),
        Subtitle: product.Subtitle ?? null,
        Description: product.Description,
        Featured: product.Featured ?? false,
        Sizes: product.Sizes,
        SurfboardSpecs: product.SurfboardSpecs ?? null,
      },
    });
    summary.created.push(`product ${product.Slug}`);
  }
}

async function main() {
  const { categories, subcategories, products } = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'catalog.json'), 'utf8'));
  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';

  const summary = { created: [], skipped: [] };
  try {
    const categoryIds = await seedBySlug(strapi, CATEGORY_UID, 'category', categories, (c) => ({ Name: c.Name, Slug: c.Slug }), summary);
    const subcategoryIds = await seedBySlug(strapi, SUBCATEGORY_UID, 'subcategory', subcategories, (s) => ({
      Name: s.Name,
      Slug: s.Slug,
      NavLabel: s.NavLabel ?? null,
      Category: lookup(categoryIds, s.CategorySlug, `Subcategory ${s.Slug}`),
    }), summary);
    await seedProducts(strapi, products, categoryIds, subcategoryIds, summary);
  } finally {
    await strapi.destroy();
  }

  for (const line of summary.created) console.log(`created  ${line}`);
  for (const line of summary.skipped) console.log(`skipped (exists)  ${line}`);
  console.log(`\nseed:catalog — ${summary.created.length} created, ${summary.skipped.length} skipped`);
}

// Exit explicitly: Strapi leaves background timers running after destroy(), and
// if one fires once the DB pool is gone it crashes the process with a Knex
// timeout — after the seed has already finished.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
