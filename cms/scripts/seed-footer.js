/**
 * Seeds the storefront footer (the `footer` single type) from seed/footer/footer.json.
 *
 *   npm run seed:footer
 *
 * Create-only: if a footer document already exists it is left untouched, so edits made in the
 * admin always survive a re-run. Without it, pages show the minimal fallback bar (site-footer
 * AC5). Safe to run while `strapi develop` is up.
 *
 * Only links to pages that exist are seeded; the design's other links (Help column, Privacy,
 * Terms, Seller Login) are added in the admin once their pages are built.
 */
const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, '..', 'seed', 'footer');
const FOOTER_UID = 'api::footer.footer';

// Seeding writes to whatever DB the env points at; refuse production unless explicitly allowed.
function assertNotProduction() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    throw new Error('seed:footer refuses to run with NODE_ENV=production. Set ALLOW_SEED=1 to override.');
  }
}

// Same rule as the storefront's footer mapper: a same-site path or an http(s) URL.
const isSafeUrl = (url) => typeof url === 'string' && ((url.startsWith('/') && !url.startsWith('//')) || /^https?:\/\//.test(url));

function assertLinks(links, owner) {
  for (const link of links ?? []) {
    if (typeof link.Label !== 'string' || !link.Label.trim()) throw new Error(`footer.json: a link in ${owner} needs a Label`);
    if (!isSafeUrl(link.Url)) throw new Error(`footer.json: unsafe or empty URL ${JSON.stringify(link.Url)} in ${owner}`);
  }
}

function readFooter(dir = SEED_DIR) {
  const footer = JSON.parse(fs.readFileSync(path.join(dir, 'footer.json'), 'utf8'));
  for (const column of footer.Columns ?? []) {
    if (typeof column.Title !== 'string' || !column.Title.trim()) throw new Error('footer.json: every column needs a Title');
    assertLinks(column.Links, `column "${column.Title}"`);
  }
  assertLinks(footer.LegalLinks, 'LegalLinks');
  return footer;
}

/** Creates the footer unless one exists. */
async function seedFooter(strapi, footer) {
  const footers = strapi.documents(FOOTER_UID);
  if (await footers.findFirst()) return 'skipped';
  await footers.create({ data: footer });
  return 'created';
}

async function main() {
  assertNotProduction();
  const footer = readFooter();
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';

  let result;
  try {
    result = await seedFooter(strapi, footer);
  } finally {
    await strapi.destroy();
  }

  console.log(
    result === 'created'
      ? `seed:footer — created the footer with ${footer.Columns.length} columns`
      : 'seed:footer — skipped (a footer already exists; edit it in the admin)'
  );
}

module.exports = { FOOTER_UID, assertNotProduction, readFooter, seedFooter };

// Exit explicitly: Strapi leaves background timers running after destroy() (see seed-catalog.js).
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
