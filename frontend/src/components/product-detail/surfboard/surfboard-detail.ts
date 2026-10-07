import { categoryHref } from '@/lib/routes';
import { strapiMediaUrl } from '@/lib/strapi/media';
import type { StrapiProductDetail, StrapiSkillLevel, StrapiSurfboardSpecs } from '@/lib/strapi/product';
import { boardLengthInches, formatBoardSize } from '@/lib/strapi/sizes';
import { formatPrice } from '@/shared/components/product-card/product-card';
import { texts } from '../product-detail-texts';

export const SCALE_MIN = 1;
export const SCALE_MAX = 100;

/** SkillLevel is the one enum attribute; it sits at the start, middle or end of the 1–100 scale. */
const SKILL_VALUE: Record<StrapiSkillLevel, number> = { Beginner: 1, Intermediate: 50, Advanced: 100 };

type NumericSpec = Exclude<keyof StrapiSurfboardSpecs, 'SkillLevel' | 'Video'>;

const ATTRIBUTE_SECTIONS: { title: string; items: { field: NumericSpec | 'SkillLevel'; label: string; scale: string[] }[] }[] = [
  {
    title: texts.sections.wave,
    items: [
      { field: 'WaveSize', ...texts.scales.waveSize },
      { field: 'Break', ...texts.scales.break },
      { field: 'Power', ...texts.scales.power },
    ],
  },
  {
    title: texts.sections.performance,
    items: [
      { field: 'Approach', ...texts.scales.approach },
      { field: 'SkillLevel', ...texts.scales.skillLevel },
      { field: 'FootOrientation', ...texts.scales.footOrientation },
    ],
  },
  {
    title: texts.sections.shape,
    items: [
      { field: 'Foil', ...texts.scales.foil },
      { field: 'NoseShape', ...texts.scales.noseShape },
      { field: 'TailWidth', ...texts.scales.tailWidth },
      { field: 'EntryRocker', ...texts.scales.entryRocker },
      { field: 'ExitRocker', ...texts.scales.exitRocker },
      { field: 'RockerStyle', ...texts.scales.rockerStyle },
    ],
  },
];

export interface AttributeScale {
  label: string;
  /** Exact 1–100 value: the fill width and the marker centre, in percent. */
  value: number;
  scale: string[];
}

export interface SurfboardDetail {
  name: string;
  price: string;
  category: { name: string; href: string };
  descriptionMarkdown: string;
  video?: { src: string; type?: string };
  images: { src: string; width: number; height: number }[];
  sizes: { label: string; soldOut: boolean }[];
  /** Index of the first in-stock size, or -1 when nothing is in stock. */
  defaultSizeIndex: number;
  attributes?: { title: string; items: AttributeScale[] }[];
}

/** Guards against out-of-range data only; in-range values pass through unrounded. */
function clampScale(value: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
}

function specValue(specs: StrapiSurfboardSpecs, field: NumericSpec | 'SkillLevel') {
  if (field === 'SkillLevel') return specs.SkillLevel ? SKILL_VALUE[specs.SkillLevel] : undefined;
  const value = specs[field];
  return typeof value === 'number' && Number.isFinite(value) ? clampScale(value) : undefined;
}

function toAttributes(specs: StrapiSurfboardSpecs) {
  return ATTRIBUTE_SECTIONS.map(({ title, items }) => ({
    title,
    items: items.flatMap(({ field, label, scale }) => {
      const value = specValue(specs, field);
      return value === undefined ? [] : [{ label, value, scale }];
    }),
  }));
}

export function toSurfboardDetail(product: StrapiProductDetail): SurfboardDetail | null {
  const { Name, Images, Category, SurfboardSpecs } = product;
  const price = Number(product.Price ?? NaN);

  if (product.SizeType !== 'Surfboard' || !Name || !Number.isFinite(price) || !Images?.length || !Category?.Name || !Category.Slug) {
    return null;
  }

  const boardSizes = [...(product.BoardSizes ?? [])].sort((a, b) => boardLengthInches(a) - boardLengthInches(b));
  const video = SurfboardSpecs?.Video?.url;

  return {
    name: Name,
    price: formatPrice(price),
    category: { name: Category.Name, href: categoryHref(Category.Slug) },
    descriptionMarkdown: product.Description ?? '',
    ...(video ? { video: { src: strapiMediaUrl(video), type: SurfboardSpecs?.Video?.mime } } : {}),
    images: Images.map((image) => ({ src: strapiMediaUrl(image.url), width: image.width, height: image.height })),
    sizes: boardSizes.map((size) => ({ label: formatBoardSize(size), soldOut: !(Number(size.Stock) > 0) })),
    defaultSizeIndex: boardSizes.findIndex((size) => Number(size.Stock) > 0),
    ...(SurfboardSpecs ? { attributes: toAttributes(SurfboardSpecs) } : {}),
  };
}
