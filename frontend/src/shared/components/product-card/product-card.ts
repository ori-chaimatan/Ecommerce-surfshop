import { productHref } from '@/lib/routes';
import { strapiMediaUrl } from '@/lib/strapi/media';

const MAX_IMAGES = 4;

export interface ProductCard {
  slug: string;
  name: string;
  price: number;
  href: string;
  images: { src: string; width: number; height: number }[];
  /** Surfboards are shown whole (contain); everything else fills the frame (cover). */
  imageFit: 'contain' | 'cover';
}

export interface StrapiProduct {
  Name?: string | null;
  Slug?: string | null;
  Price?: number | string | null;
  Images?: { url: string; width: number; height: number }[] | null;
  Category?: { Slug?: string | null } | null;
}

export function toProductCard(product: StrapiProduct): ProductCard | null {
  const { Name, Slug, Images, Category } = product;
  const price = Number(product.Price ?? NaN);

  if (!Name || !Slug || !Number.isFinite(price) || !Images?.length) {
    return null;
  }

  return {
    slug: Slug,
    name: Name,
    price,
    href: productHref(Slug),
    images: Images.slice(0, MAX_IMAGES).map((image) => ({
      src: strapiMediaUrl(image.url),
      width: image.width,
      height: image.height,
    })),
    imageFit: Category?.Slug === 'surfboards' ? 'contain' : 'cover',
  };
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}
