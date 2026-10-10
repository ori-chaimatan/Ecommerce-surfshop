import { strapiFetch } from './client';
import type { StrapiGender } from '@/lib/routes';
import type { ProductSizeType, StrapiBoardSize, StrapiStandardSize } from './sizes';

export type StrapiSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StrapiSurfboardSpecs {
  SkillLevel?: StrapiSkillLevel | null;
  Video?: { url?: string; mime?: string } | null;
  WaveSize?: number | null;
  Break?: number | null;
  Power?: number | null;
  Approach?: number | null;
  FootOrientation?: number | null;
  Foil?: number | null;
  NoseShape?: number | null;
  TailWidth?: number | null;
  EntryRocker?: number | null;
  ExitRocker?: number | null;
  RockerStyle?: number | null;
}

/** One product as the detail page requests it; every field may be missing, so the mapper validates. */
export interface StrapiProductDetail {
  /** Strapi v5 returns it on every document, whatever `fields` asks for. */
  documentId?: string;
  Name?: string;
  Slug?: string;
  Price?: number | string | null;
  Description?: string | null;
  SizeType?: ProductSizeType | null;
  Gender?: StrapiGender | null;
  Images?: { url: string; width: number; height: number }[] | null;
  Category?: { Name?: string; Slug?: string } | null;
  BoardSizes?: StrapiBoardSize[] | null;
  StandardSizes?: StrapiStandardSize[] | null;
  SurfboardSpecs?: StrapiSurfboardSpecs | null;
}

export type ProductBySlugResult =
  | { kind: 'ok'; product: StrapiProductDetail }
  | { kind: 'not-found' }
  | { kind: 'unavailable' };

function productDetailQuery(slug: string) {
  return new URLSearchParams({
    'filters[Slug][$eq]': slug,
    'fields[0]': 'Name',
    'fields[1]': 'Slug',
    'fields[2]': 'Price',
    'fields[3]': 'Description',
    'fields[4]': 'SizeType',
    'fields[5]': 'Gender',
    'populate[Images][fields][0]': 'url',
    'populate[Images][fields][1]': 'width',
    'populate[Images][fields][2]': 'height',
    'populate[Category][fields][0]': 'Name',
    'populate[Category][fields][1]': 'Slug',
    'populate[BoardSizes]': 'true',
    'populate[StandardSizes]': 'true',
    'populate[SurfboardSpecs][populate][Video][fields][0]': 'url',
    'populate[SurfboardSpecs][populate][Video][fields][1]': 'mime',
    'pagination[pageSize]': '1',
  }).toString();
}

export async function getProductBySlug(slug: string): Promise<ProductBySlugResult> {
  const json = (await strapiFetch(`products?${productDetailQuery(slug)}`, { label: 'product', fallback: null })) as {
    data?: StrapiProductDetail[];
  } | null;

  if (!Array.isArray(json?.data)) return { kind: 'unavailable' };
  if (json.data.length === 0) return { kind: 'not-found' };
  return { kind: 'ok', product: json.data[0] };
}
