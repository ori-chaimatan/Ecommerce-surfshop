/**
 * Smoke-checks the catalog REST contract against a running Strapi (public role).
 *
 *   npm run verify:catalog            # STRAPI_URL defaults to http://localhost:1337
 *
 * Covers product-content-model AC5, AC7–AC10 and AC12 over public REST, plus the
 * lifecycle hook (AC6 Category/Subcategory consistency, AC11 Gender rule, AC14 size
 * rules, AC15 stale-size clearing) by loading Strapi in-process —
 * the public role can't write, so rejected saves are exercised through the
 * Document Service with throwaway products that are always deleted again.
 * Expects `npm run seed:catalog` to have been run; checks key off the seeded
 * slugs, so products added in the admin don't break it. Exits non-zero on any failure.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';
const catalog = JSON.parse(readFileSync(new URL('../seed/catalog/catalog.json', import.meta.url), 'utf8'));

const seededProducts = new Set(catalog.products.map((p) => p.Slug));
const seededBoards = catalog.products.filter((p) => p.SurfboardSpecs).map((p) => p.Slug);

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`);
}

async function api(path, init) {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, init);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function productSlugs(query) {
  const { status, body } = await api(`products?${query}&fields[0]=Slug&pagination[pageSize]=100`);
  if (status !== 200) throw new Error(`GET products?${query} → ${status} ${JSON.stringify(body?.error ?? body)}`);
  return body.data.map((p) => p.Slug).filter((slug) => seededProducts.has(slug)).sort();
}

const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const expectSlugs = (filter) => catalog.products.filter(filter).map((p) => p.Slug);

// AC6 + AC11 + AC14 — the lifecycle hook rejects Subcategories outside the product's
// Category, a Clothing product without Gender, a non-Clothing product with one, and
// any save that breaks the size model. AC15 — omitted stale sizes are cleared.
async function verifyConsistencyHook() {
  const require = createRequire(import.meta.url);
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';

  const P = 'api::product.product';
  const docId = async (uid, Slug) => (await strapi.documents(uid).findFirst({ filters: { Slug } }))?.documentId;
  const surfboards = await docId('api::category.category', 'surfboards');
  const clothing = await docId('api::category.category', 'clothing');
  const funBoard = await docId('api::subcategory.subcategory', 'fun-board');
  const boardshorts = await docId('api::subcategory.subcategory', 'boardshorts');
  // Any seeded product's first photo will do for the throwaway products.
  const imageId = (await strapi.db.query(P).findOne({ where: { Slug: { $in: [...seededProducts] } }, populate: { Images: { select: ['id'] } } }))?.Images?.[0]?.id;
  const base = { Price: 1, Images: imageId ? [imageId] : [], Description: 'verify:catalog throwaway' };
  const BOARD = { SizeType: 'Surfboard', BoardSizes: [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 0 }] };
  const STANDARD = { SizeType: 'Standard', StandardSizes: [{ Size: 'M', Stock: 0 }] };
  const throwaway = [];

  // Only the hook's own error counts — a required-field ValidationError would be a false pass.
  const rejected = async (name, pattern, save) => {
    try {
      const doc = await save();
      if (doc?.documentId) throwaway.push(doc.documentId);
      check(name, false, 'save was accepted');
    } catch (error) {
      check(name, error.name === 'ValidationError' && pattern.test(error.message), `${error.name}: ${error.message}`);
    }
  };
  const create = (Slug, data) => strapi.documents(P).create({ data: { Name: Slug, Slug, ...base, ...data } });
  const SUBCATEGORY = /Subcategories must belong/;
  const GENDER = /Gender/;
  const SIZE_TYPE = /Size type/;
  const NEEDS_SIZE = /Add at least one/;
  const WRONG_COMPONENT = /only apply to Size type/;
  const DUPLICATE = /Duplicate/;
  const ONE_SIZE = /OneSize must be the only/;

  try {
    await rejected('AC6 create with a Subcategory from another Category is rejected', SUBCATEGORY, () =>
      create('verify-catalog-mismatch', { Category: surfboards, Subcategories: [boardshorts], ...BOARD }));

    const valid = await create('verify-catalog-valid', { Category: surfboards, Subcategories: [funBoard], ...BOARD });
    throwaway.push(valid.documentId);
    check('AC6 create with a matching Subcategory is accepted', Boolean(valid.documentId));

    await rejected('AC6 update connecting a Subcategory from another Category is rejected', SUBCATEGORY, () =>
      strapi.documents(P).update({ documentId: valid.documentId, data: { Subcategories: { connect: [boardshorts] } } }));
    await rejected('AC6 update changing Category away from the existing Subcategories is rejected', SUBCATEGORY, () =>
      strapi.documents(P).update({ documentId: valid.documentId, data: { Category: clothing } }));

    const moved = await strapi.documents(P).update({
      documentId: valid.documentId,
      data: { Category: clothing, Subcategories: { set: [boardshorts] }, Gender: 'Men', ...STANDARD },
    });
    check('AC6 update changing Category and Subcategories together is accepted', Boolean(moved?.documentId));
    // AC15 — BoardSizes was omitted from that update (as the admin does once it's hidden), so it's cleared.
    const movedSizes = await strapi.documents(P).findOne({ documentId: valid.documentId, populate: ['BoardSizes', 'StandardSizes'] });
    check('AC15 switching SizeType clears the omitted, now-hidden BoardSizes',
      movedSizes?.BoardSizes?.length === 0 && movedSizes?.StandardSizes?.length === 1,
      `BoardSizes ${movedSizes?.BoardSizes?.length}, StandardSizes ${movedSizes?.StandardSizes?.length}`);

    await rejected('AC11 a Clothing product without Gender is rejected', GENDER, () =>
      create('verify-catalog-no-gender', { Category: clothing, Subcategories: [boardshorts], ...STANDARD }));
    await rejected('AC11 a non-Clothing product with Gender is rejected', GENDER, () =>
      create('verify-catalog-gender-board', { Category: surfboards, Subcategories: [funBoard], Gender: 'Unisex', ...BOARD }));
    await rejected('AC11 clearing Gender on a Clothing product is rejected', GENDER, () =>
      strapi.documents(P).update({ documentId: valid.documentId, data: { Gender: null } }));
    await rejected('AC11 moving a gendered product out of Clothing without clearing Gender is rejected', GENDER, () =>
      strapi.documents(P).update({ documentId: valid.documentId, data: { Category: surfboards, Subcategories: { set: [funBoard] } } }));

    // AC14 rule 1 — Surfboards ⇔ Surfboard, everything else ⇔ Standard.
    await rejected('AC14 a Surfboards product with SizeType Standard is rejected', SIZE_TYPE, () =>
      create('verify-catalog-board-standard', { Category: surfboards, ...STANDARD }));
    await rejected('AC14 a Clothing product with SizeType Surfboard is rejected', SIZE_TYPE, () =>
      create('verify-catalog-tee-surfboard', { Category: clothing, Gender: 'Men', ...BOARD }));
    // Rule 2 — the matching component needs ≥1 entry; the other one none.
    await rejected('AC14 a Surfboard product without BoardSizes is rejected', NEEDS_SIZE, () =>
      create('verify-catalog-no-board-sizes', { Category: surfboards, SizeType: 'Surfboard', BoardSizes: [] }));
    await rejected('AC14 a Standard product without StandardSizes is rejected', NEEDS_SIZE, () =>
      create('verify-catalog-no-standard-sizes', { Category: clothing, Gender: 'Men', SizeType: 'Standard' }));
    await rejected('AC14 explicit StandardSizes on a Surfboard product are rejected', WRONG_COMPONENT, () =>
      create('verify-catalog-both-sizes', { Category: surfboards, ...BOARD, StandardSizes: [{ Size: 'M', Stock: 1 }] }));
    // Rule 3 — no duplicates.
    await rejected('AC14 a duplicate Standard size is rejected', DUPLICATE, () =>
      create('verify-catalog-dup-size', { Category: clothing, Gender: 'Men', SizeType: 'Standard', StandardSizes: [{ Size: 'M', Stock: 1 }, { Size: 'M', Stock: 2 }] }));
    await rejected('AC14 a duplicate length + VolumeL pair is rejected', DUPLICATE, () =>
      create('verify-catalog-dup-board', { Category: surfboards, SizeType: 'Surfboard', BoardSizes: [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 1 }, { LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 2 }] }));
    // Feet + inches stay in range: LengthFt 4–12, LengthInches 0–11 (schema min/max).
    for (const [label, size] of [['LengthInches 12', { LengthFt: 6, LengthInches: 12 }], ['LengthFt 3', { LengthFt: 3, LengthInches: 0 }], ['LengthFt 13', { LengthFt: 13, LengthInches: 0 }]]) {
      await rejected(`AC5 a board size with ${label} is rejected`, /must be (less|greater) than or equal to/, () =>
        create(`verify-catalog-range-${label.replace(' ', '-').toLowerCase()}`, { Category: surfboards, SizeType: 'Surfboard', BoardSizes: [{ ...size, VolumeL: 29.4, Stock: 1 }] }));
    }
    // Rule 4 — OneSize stands alone.
    await rejected('AC14 OneSize alongside another size is rejected', ONE_SIZE, () =>
      create('verify-catalog-one-size', { Category: clothing, Gender: 'Men', SizeType: 'Standard', StandardSizes: [{ Size: 'OneSize', Stock: 1 }, { Size: 'M', Stock: 1 }] }));
    // Update path — only the size field changes, the rest comes from the stored product.
    await rejected('AC14 an update adding a duplicate Standard size is rejected', DUPLICATE, () =>
      strapi.documents(P).update({ documentId: valid.documentId, data: { StandardSizes: [{ Size: 'L', Stock: 1 }, { Size: 'L', Stock: 1 }] } }));
    const resized = await strapi.documents(P).update({ documentId: valid.documentId, data: { StandardSizes: [{ Size: 'OneSize', Stock: 3 }] } });
    check('AC14 a valid size-only update is accepted', Boolean(resized?.documentId));
  } finally {
    for (const documentId of throwaway) await strapi.documents(P).delete({ documentId }).catch(() => {});
    await strapi.destroy();
  }
}

async function main() {
  // AC7 — public read, no public writes
  const list = await api('products?pagination[pageSize]=1');
  check('AC7 GET /api/products is public', list.status === 200, `status ${list.status}`);
  const cats = await api('categories?pagination[pageSize]=1');
  check('AC7 GET /api/categories is public', cats.status === 200, `status ${cats.status}`);

  const anyProduct = list.body?.data?.[0]?.documentId;
  const one = await api(`products/${anyProduct}`);
  check('AC7 GET /api/products/:id is public', one.status === 200, `status ${one.status}`);
  const anyCategory = cats.body?.data?.[0]?.documentId;
  const oneCat = await api(`categories/${anyCategory}`);
  check('AC7 GET /api/categories/:id is public', oneCat.status === 200, `status ${oneCat.status}`);
  const subs = await api('subcategories?pagination[pageSize]=1');
  check('AC7 GET /api/subcategories is public', subs.status === 200, `status ${subs.status}`);
  const anySubcategory = subs.body?.data?.[0]?.documentId;
  const oneSub = await api(`subcategories/${anySubcategory}`);
  check('AC7 GET /api/subcategories/:id is public', oneSub.status === 200, `status ${oneSub.status}`);

  const json = { 'Content-Type': 'application/json' };
  for (const [method, path] of [
    ['POST', 'products'],
    ['PUT', `products/${anyProduct}`],
    ['DELETE', `products/${anyProduct}`],
    ['POST', 'categories'],
    ['PUT', `categories/${anyCategory}`],
    ['DELETE', `categories/${anyCategory}`],
    ['POST', 'subcategories'],
    ['PUT', `subcategories/${anySubcategory}`],
    ['DELETE', `subcategories/${anySubcategory}`],
  ]) {
    const res = await api(path, { method, headers: json, body: method === 'DELETE' ? undefined : JSON.stringify({ data: { Name: 'x' } }) });
    check(`AC7 public ${method} /api/${path.split('/')[0]} is forbidden`, res.status === 403, `status ${res.status}`);
  }

  // AC9 — seeded categories, subcategories and products present and complete
  const allCats = await api('categories?pagination[pageSize]=100&fields[0]=Slug');
  const catSlugs = new Set(allCats.body.data.map((c) => c.Slug));
  const missingCats = catalog.categories.filter((c) => !catSlugs.has(c.Slug)).map((c) => c.Slug);
  check(`AC9 all ${catalog.categories.length} seeded categories exist`, missingCats.length === 0, `missing: ${missingCats.join(', ')}`);

  const allSubs = await api('subcategories?pagination[pageSize]=100&fields[0]=Slug&populate[Category][fields][0]=Slug');
  const subBySlug = Object.fromEntries(allSubs.body.data.map((s) => [s.Slug, s]));
  const missingSubs = catalog.subcategories.filter((s) => !subBySlug[s.Slug]).map((s) => s.Slug);
  check(`AC9 all ${catalog.subcategories.length} seeded subcategories exist`, missingSubs.length === 0, `missing: ${missingSubs.join(', ')}`);
  const wrongCat = catalog.subcategories
    .filter((s) => subBySlug[s.Slug] && subBySlug[s.Slug].Category?.Slug !== s.CategorySlug)
    .map((s) => s.Slug);
  check('AC9 every seeded subcategory belongs to its design category', wrongCat.length === 0, `wrong: ${wrongCat.join(', ')}`);

  const full = await api(
    'products?pagination[pageSize]=100&populate[Images][fields][0]=url&populate[BoardSizes]=true&populate[StandardSizes]=true&populate[SurfboardSpecs]=true&populate[Category][fields][0]=Slug&populate[Subcategories][fields][0]=Slug'
  );
  const bySlug = Object.fromEntries(full.body.data.map((p) => [p.Slug, p]));
  const missing = [...seededProducts].filter((slug) => !bySlug[slug]);
  check(`AC9 all ${seededProducts.size} seeded products exist`, missing.length === 0, `missing: ${missing.join(', ')}`);

  const incomplete = [...seededProducts]
    .filter((slug) => bySlug[slug])
    .filter((slug) => !bySlug[slug].Images?.length || !bySlug[slug].Category);
  check('AC9 every seeded product has images and a category', incomplete.length === 0, incomplete.join(', '));

  // AC5 + AC9 — SizeType follows the Category; only the matching component has entries.
  const wrongSizes = catalog.products
    .filter((p) => bySlug[p.Slug])
    .filter((p) => {
      const product = bySlug[p.Slug];
      const isBoard = p.CategorySlug === 'surfboards';
      const [own, other] = isBoard ? [product.BoardSizes, product.StandardSizes] : [product.StandardSizes, product.BoardSizes];
      return product.SizeType !== (isBoard ? 'Surfboard' : 'Standard') || !own?.length || other?.length || 'Sizes' in product || 'Label' in (own?.[0] ?? {});
    })
    .map((p) => `${p.Slug} (${bySlug[p.Slug].SizeType})`);
  check('AC9 every seeded product has the SizeType of its Category and only the matching sizes', wrongSizes.length === 0, wrongSizes.join(', '));
  const badSeed = catalog.products.filter((p) => 'Sizes' in p || !p.SizeType || !(p.SizeType === 'Surfboard' ? p.BoardSizes : p.StandardSizes)?.length).map((p) => p.Slug);
  check('AC9 seed data: every product has a SizeType and its matching sizes (no Sizes/Label)', badSeed.length === 0, badSeed.join(', '));
  const wrongRelations = catalog.products
    .filter((p) => bySlug[p.Slug])
    .filter((p) => bySlug[p.Slug].Category?.Slug !== p.CategorySlug ||
      !same(bySlug[p.Slug].Subcategories.map((s) => s.Slug), p.SubcategorySlugs))
    .map((p) => p.Slug);
  check('AC9 every seeded product has its design Category and Subcategories', wrongRelations.length === 0, wrongRelations.join(', '));
  const wrongGender = catalog.products
    .filter((p) => bySlug[p.Slug] && (bySlug[p.Slug].Gender ?? null) !== (p.Gender ?? null))
    .map((p) => `${p.Slug} (${bySlug[p.Slug].Gender ?? 'none'})`);
  check('AC9 every seeded product has its design Gender (Clothing only)', wrongGender.length === 0, wrongGender.join(', '));
  const boardsWithoutSpecs = seededBoards.filter((slug) => bySlug[slug] && !bySlug[slug].SurfboardSpecs);
  check('AC9 every seeded surfboard has SurfboardSpecs', boardsWithoutSpecs.length === 0, boardsWithoutSpecs.join(', '));

  const samurai = bySlug['samurai-pro-22-boardshort'];
  if (samurai) {
    // Waist sizes 28–40 bucketed into S/M/L/XL with stock summed (see spec.md Technical Approach).
    const sizes = (samurai.StandardSizes ?? []).map((s) => `${s.Size}:${s.Stock}`);
    check('AC9 Samurai Pro matches the design (price, S/M/L/XL with summed stock, 6 photos)',
      Number(samurai.Price) === 79 && same(sizes, ['S:16', 'M:24', 'L:24', 'XL:12']) && samurai.Images.length === 6 && samurai.Subtitle === 'Performance stretch',
      `price ${samurai.Price}, sizes ${sizes.join(' ')}, images ${samurai.Images.length}`);
  }

  // AC8 — component and relation filters + sort
  const intermediate = await productSlugs('filters[SurfboardSpecs][SkillLevel][$eq]=Intermediate');
  check('AC8 SkillLevel=Intermediate returns exactly the intermediate boards',
    same(intermediate, expectSlugs((p) => p.SurfboardSpecs?.SkillLevel === 'Intermediate')), `got ${intermediate.join(', ')}`);

  const volume = await productSlugs('filters[BoardSizes][VolumeL][$between][0]=30&filters[BoardSizes][VolumeL][$between][1]=40');
  check('AC8 BoardSizes.VolumeL between 30–40 matches boards with any size in range',
    same(volume, expectSlugs((p) => (p.BoardSizes ?? []).some((s) => s.VolumeL >= 30 && s.VolumeL <= 40))), `got ${volume.join(', ')}`);

  const medium = await productSlugs('filters[StandardSizes][Size][$eq]=M');
  const expectedMedium = expectSlugs((p) => (p.StandardSizes ?? []).some((s) => s.Size === 'M'));
  check('AC8 StandardSizes.Size = M returns exactly the products offering M',
    medium.length > 0 && same(medium, expectedMedium), `got ${medium.join(', ')}`);

  for (const { Slug } of catalog.categories) {
    const got = await productSlugs(`filters[Category][Slug][$eq]=${Slug}`);
    check(`AC8 main category "${Slug}"`, same(got, expectSlugs((p) => p.CategorySlug === Slug)), `got ${got.join(', ')}`);
  }
  const surfboards = await productSlugs('filters[Category][Slug][$eq]=surfboards');
  check(`AC8 main category "surfboards" returns exactly the ${seededBoards.length} seeded boards`, same(surfboards, seededBoards), `got ${surfboards.length}`);

  for (const { Slug } of catalog.subcategories) {
    const got = await productSlugs(`filters[Subcategories][Slug][$eq]=${Slug}`);
    check(`AC8 subcategory "${Slug}"`, same(got, expectSlugs((p) => p.SubcategorySlugs.includes(Slug))), `got ${got.join(', ')}`);
  }
  const multi = catalog.products.filter((p) => p.SubcategorySlugs.length > 1);
  check('AC9 at least one seeded surfboard has two subcategories', multi.some((p) => p.SurfboardSpecs));
  for (const product of multi) {
    for (const sub of product.SubcategorySlugs) {
      const got = await productSlugs(`filters[Subcategories][Slug][$eq]=${sub}`);
      check(`AC8 "${product.Slug}" (${product.SubcategorySlugs.length} subcategories) appears under "${sub}"`, got.includes(product.Slug));
    }
  }

  // AC12 — Clothing gender filters: Men → Gender in [Men, Unisex], Women → [Women, Unisex].
  for (const [label, genders] of [['Men', ['Men', 'Unisex']], ['Women', ['Women', 'Unisex']]]) {
    const q = `filters[Category][Slug][$eq]=clothing&filters[Gender][$in][0]=${genders[0]}&filters[Gender][$in][1]=${genders[1]}`;
    const got = await productSlugs(q);
    const expected = expectSlugs((p) => p.CategorySlug === 'clothing' && genders.includes(p.Gender));
    check(`AC12 Clothing ${label} filter returns Gender ${genders.join(' or ')}`, got.length > 0 && same(got, expected), `got ${got.join(', ')}`);
    const unisex = expectSlugs((p) => p.CategorySlug === 'clothing' && p.Gender === 'Unisex');
    check(`AC12 Clothing ${label} filter includes the Unisex products`, unisex.length > 0 && unisex.every((s) => got.includes(s)), `got ${got.join(', ')}`);
  }
  const genderless = catalog.products.filter((p) => (p.CategorySlug === 'clothing') !== Boolean(p.Gender)).map((p) => p.Slug);
  check('AC11 seed data: every Clothing product has a Gender and no other product does', genderless.length === 0, genderless.join(', '));

  const featured = await productSlugs('filters[Featured][$eq]=true');
  check('AC8 Featured=true', same(featured, expectSlugs((p) => p.Featured)), `got ${featured.join(', ')}`);

  for (const dir of ['asc', 'desc']) {
    const { body } = await api(`products?sort=Price:${dir}&fields[0]=Price&pagination[pageSize]=100`);
    const prices = body.data.map((p) => Number(p.Price));
    const sorted = [...prices].sort((a, b) => (dir === 'asc' ? a - b : b - a));
    check(`AC8 sort=Price:${dir}`, prices.join() === sorted.join(), prices.join(', '));
  }

  // AC10 — uid Slugs keep reruns from creating duplicates
  const slugs = full.body.data.map((p) => p.Slug);
  check('AC10 no duplicate product slugs', slugs.length === new Set(slugs).size);

  await verifyConsistencyHook();

  console.log(failures ? `\nverify:catalog — ${failures} FAILED` : '\nverify:catalog — all checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
