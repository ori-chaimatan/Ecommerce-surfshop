/**
 * Dev-only: deletes the seeded products so `npm run seed:catalog` (create-only) can
 * seed them again after a seed format change.
 *
 *   npm run reset:catalog                  # dry run — lists what would be deleted
 *   npm run reset:catalog -- --yes         # deletes the products listed in catalog.json
 *   npm run reset:catalog -- --yes --all   # also deletes products created in the admin
 *
 * Refuses to run when NODE_ENV is production or the database isn't SQLite or a
 * local Postgres/MySQL (host localhost / 127.0.0.1). Products are deleted through
 * the Document Service, so their size/spec components and relations go with them.
 * Images the seed uploaded for a product (named `<slug>-…`) are removed too; any
 * other image attached in the admin is left in the Media Library. Categories and
 * subcategories are kept — the seed skips them when they already exist.
 */
const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const PRODUCT_UID = 'api::product.product';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const CATALOG_PATH = path.join(__dirname, '..', 'seed', 'catalog', 'catalog.json');

function assertDevDatabase(strapi) {
  const environment = strapi.config.get('environment') ?? process.env.NODE_ENV;
  if (environment === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('reset:catalog refuses to run with NODE_ENV=production.');
  }

  const client = strapi.config.get('database.connection.client');
  const host = strapi.config.get('database.connection.connection.host');
  if (client !== 'sqlite' && !LOCAL_HOSTS.includes(host)) {
    throw new Error(`reset:catalog only runs against SQLite or a local database; this one is ${client} on "${host}".`);
  }
}

async function main() {
  const confirmed = process.argv.includes('--yes');
  const all = process.argv.includes('--all');
  const seededSlugs = new Set(JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')).products.map((p) => p.Slug));
  if (process.env.NODE_ENV === 'production') {
    throw new Error('reset:catalog refuses to run with NODE_ENV=production.');
  }

  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';

  try {
    assertDevDatabase(strapi);

    const everything = await strapi.db.query(PRODUCT_UID).findMany({
      select: ['id', 'documentId', 'Slug'],
      populate: { Images: { select: ['id', 'name'] } },
    });
    const products = all ? everything : everything.filter((product) => seededSlugs.has(product.Slug));
    const kept = everything.filter((product) => !products.includes(product));
    const seededImages = (product) => (product.Images ?? []).filter((image) => image.name?.startsWith(`${product.Slug}-`));

    if (!confirmed) {
      for (const product of products) {
        console.log(`would delete  product ${product.Slug} (+${seededImages(product).length} seeded images)`);
      }
      for (const product of kept) console.log(`would keep    product ${product.Slug} (not in catalog.json; add --all to delete)`);
      console.log(`\nreset:catalog — dry run, ${products.length} to delete, ${kept.length} kept. Re-run with \`npm run reset:catalog -- --yes${all ? ' --all' : ''}\` to delete them.`);
      return;
    }

    const upload = strapi.plugin('upload').service('upload');
    let images = 0;
    for (const product of products) {
      await strapi.documents(PRODUCT_UID).delete({ documentId: product.documentId });
      for (const image of seededImages(product)) {
        const file = await strapi.db.query('plugin::upload.file').findOne({ where: { id: image.id } });
        if (file) {
          await upload.remove(file);
          images++;
        }
      }
      console.log(`deleted  product ${product.Slug}`);
    }
    for (const product of kept) console.log(`kept     product ${product.Slug} (not in catalog.json)`);
    console.log(`\nreset:catalog — ${products.length} products and ${images} seeded images deleted, ${kept.length} kept. Run \`npm run seed:catalog\` next.`);
  } finally {
    await strapi.destroy();
  }
}

// Exit explicitly: Strapi leaves background timers running after destroy() (see seed-catalog.js).
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
