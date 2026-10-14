/**
 * Seeds the Home hero (the `homepage` single type) from seed/homepage/homepage.json.
 *
 *   npm run seed:homepage
 *
 * Create-only: if a homepage document already exists it is left untouched, so edits made in
 * the admin always survive a re-run. Without it, `/` shows the "Coming Soon" fallback
 * (home-hero AC13) — which is what a fresh or reset database looks like. Safe to run while
 * `strapi develop` is up.
 *
 * Slide photos, per slide key, first match wins: seed/homepage/images-local/<key>.jpg
 * (gitignored, local-only — extracted from the design files, not cleared for the repo), then a
 * committed seed/homepage/<key>.jpg, then a generated placeholder.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SEED_DIR = path.join(__dirname, '..', 'seed', 'homepage');
const HOMEPAGE_UID = 'api::homepage.homepage';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Seeding writes to whatever DB the env points at; refuse production unless explicitly allowed.
function assertNotProduction() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    throw new Error('seed:homepage refuses to run with NODE_ENV=production. Set ALLOW_SEED=1 to override.');
  }
}

// Keys name image files, so they must stay plain: no `..`, no separators.
/** The Featured gear section copy (home-featured-gear), optional. */
function readFeatured(dir = SEED_DIR) {
  const { FeaturedEyebrow = null, FeaturedTitle = null } = JSON.parse(fs.readFileSync(path.join(dir, 'homepage.json'), 'utf8'));
  return { FeaturedEyebrow, FeaturedTitle };
}

function readSlides(dir = SEED_DIR) {
  const { slides } = JSON.parse(fs.readFileSync(path.join(dir, 'homepage.json'), 'utf8'));
  for (const slide of slides) {
    if (typeof slide.key !== 'string' || !/^[a-z0-9-]+$/.test(slide.key)) {
      throw new Error(`homepage.json: unsafe key ${JSON.stringify(slide.key)}`);
    }
  }
  return slides;
}

function firstImage(dir, key) {
  for (const extension of IMAGE_EXTENSIONS) {
    const filepath = path.join(dir, `${key}${extension}`);
    if (fs.existsSync(filepath)) return filepath;
  }
  return null;
}

/** The slide's photo on disk, or null when a placeholder has to be generated. */
function slideImagePath(dir, key) {
  return firstImage(path.join(dir, 'images-local'), key) ?? firstImage(dir, key);
}

function escapeXml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

// Visibly-fake hero image in WESTLINE ink/horizon, so it's obvious in the admin which slides still need a photo.
async function renderPlaceholder(title, key, dir) {
  const sharp = require('sharp');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
    <rect width="100%" height="100%" fill="#101828"/>
    <rect y="900" width="100%" height="180" fill="#155EEF"/>
    <text x="960" y="520" text-anchor="middle" font-family="Poppins, Helvetica, Arial, sans-serif" font-size="88" font-weight="800" fill="#FFFFFF">${escapeXml(title.toUpperCase())}</text>
    <text x="960" y="600" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="36" fill="#94A3B8">PLACEHOLDER IMAGE</text>
  </svg>`;
  const filepath = path.join(dir, `${key}-placeholder.jpg`);
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

async function slideImageId(strapi, slide) {
  const filepath = slideImagePath(SEED_DIR, slide.key);
  if (filepath) return uploadImage(strapi, filepath, `hero-${slide.key}${path.extname(filepath)}`);

  // A private temp dir (mkdtemp), not a predictable path in the shared tmpdir.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-homepage-'));
  try {
    return await uploadImage(strapi, await renderPlaceholder(slide.Title, slide.key, dir), `hero-${slide.key}-placeholder.jpg`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function removeUploads(strapi, ids) {
  const upload = strapi.plugin('upload').service('upload');
  for (const id of ids) {
    const file = await strapi.db.query('plugin::upload.file').findOne({ where: { id } });
    if (file) await upload.remove(file).catch((error) => console.error(`could not remove upload ${id}:`, error.message));
  }
}

/** Creates the homepage unless one exists. `deps` is injectable so the rule is testable without Strapi. */
async function seedHomepage(strapi, slides, deps, featured = {}) {
  const homepage = strapi.documents(HOMEPAGE_UID);
  if (await homepage.findFirst()) return 'skipped';

  const imageIds = [];
  try {
    for (const slide of slides) imageIds.push(await deps.imageFor(slide));
    await homepage.create({
      data: {
        ...featured,
        Hero: slides.map((slide, index) => ({
          Title: slide.Title,
          BackgroundImg: imageIds[index],
          Button: { Text: slide.Button.Text, LinkUrl: slide.Button.LinkUrl },
        })),
      },
    });
  } catch (error) {
    // Don't leave orphaned uploads behind: a rerun would upload them again.
    await deps.removeUploads(imageIds);
    throw error;
  }
  return 'created';
}

async function main() {
  assertNotProduction();
  const slides = readSlides();
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';

  let result;
  try {
    result = await seedHomepage(strapi, slides, {
      imageFor: (slide) => slideImageId(strapi, slide),
      removeUploads: (ids) => removeUploads(strapi, ids),
    }, readFeatured());
  } finally {
    await strapi.destroy();
  }

  console.log(
    result === 'created'
      ? `seed:homepage — created the homepage with ${slides.length} hero slides`
      : 'seed:homepage — skipped (a homepage already exists; edit it in the admin)'
  );
}

module.exports = { HOMEPAGE_UID, assertNotProduction, readFeatured, readSlides, seedHomepage, slideImagePath };

// Exit explicitly: Strapi leaves background timers running after destroy() (see seed-catalog.js).
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
