import { GENDERED_CATEGORY_SLUGS, categoryHref, genderHref } from '@/lib/routes';
import { strapiMediaUrl } from '@/lib/strapi/media';
import type { StrapiProductDetail } from '@/lib/strapi/product';
import { formatStandardSize, standardSizeKey, type StandardSizeValue } from '@/lib/strapi/sizes';
import { formatPrice } from '@/shared/components/product-card/product-card';

/** A size with 1 to this many in stock is flagged as running low. */
export const LOW_STOCK_MAX = 3;

const SIZE_ORDER: StandardSizeValue[] = ['S', 'M', 'L', 'XL', 'OneSize'];

export interface StandardDetail {
  /** The product's Strapi documentId, for Add to Cart. */
  documentId: string;
  name: string;
  price: string;
  category: { name: string; href: string };
  /** Only for Men / Women products in a gendered category (clothing). */
  gender?: { label: string; href: string };
  descriptionMarkdown: string;
  images: { src: string; width: number; height: number }[];
  /** `key` identifies the size in a cart line (`standardSizeKey`). */
  sizes: { label: string; soldOut: boolean; lowStock: boolean; key: string }[];
  /** Index of the first in-stock size, or -1 when nothing is in stock. */
  defaultSizeIndex: number;
}

function toGender(product: StrapiProductDetail, categorySlug: string): StandardDetail['gender'] {
  const { Gender } = product;
  if ((Gender !== 'Men' && Gender !== 'Women') || !GENDERED_CATEGORY_SLUGS.includes(categorySlug)) return undefined;
  return { label: Gender, href: genderHref(categorySlug, Gender === 'Men' ? 'men' : 'women') };
}

export function toStandardDetail(product: StrapiProductDetail): StandardDetail | null {
  const { documentId, Name, Images, Category } = product;
  const price = Number(product.Price ?? NaN);

  if (product.SizeType !== 'Standard' || !documentId || !Name || !Number.isFinite(price) || !Images?.length || !Category?.Name || !Category.Slug) {
    return null;
  }

  const sizes = [...(product.StandardSizes ?? [])].sort((a, b) => SIZE_ORDER.indexOf(a.Size) - SIZE_ORDER.indexOf(b.Size));
  const gender = toGender(product, Category.Slug);

  return {
    documentId,
    name: Name,
    price: formatPrice(price),
    category: { name: Category.Name, href: categoryHref(Category.Slug) },
    ...(gender ? { gender } : {}),
    descriptionMarkdown: product.Description ?? '',
    images: Images.map((image) => ({ src: strapiMediaUrl(image.url), width: image.width, height: image.height })),
    sizes: sizes.map((size) => {
      const stock = Number(size.Stock);
      return {
        label: formatStandardSize(size.Size),
        soldOut: !(stock > 0),
        lowStock: stock > 0 && stock <= LOW_STOCK_MAX,
        key: standardSizeKey(size),
      };
    }),
    defaultSizeIndex: sizes.findIndex((size) => Number(size.Stock) > 0),
  };
}
