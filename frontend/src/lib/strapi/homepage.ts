import { toButtonCta, type ButtonCtaData, type StrapiButtonCta } from '@/shared/components/button-cta/button-cta';
import { strapiFetch } from './client';
import { strapiMediaUrl } from './media';

const HOMEPAGE_QUERY = new URLSearchParams({
  'populate[Hero][populate][BackgroundImg]': 'true',
  'populate[Hero][populate][Button][populate]': 'targetLink',
}).toString();

export interface HeroSlide {
  headline: string;
  subtext?: string;
  image: { src: string; width: number; height: number };
  cta: ButtonCtaData;
}

interface StrapiHero {
  Title?: string | null;
  BackgroundImg?: { url?: string; width?: number; height?: number } | null;
  Button?: StrapiButtonCta | null;
}

function normalizeHero(hero: StrapiHero): HeroSlide | null {
  const { Title, BackgroundImg, Button } = hero ?? {};
  const cta = toButtonCta(Button);
  if (!Title || !cta || !BackgroundImg?.url || !BackgroundImg.width || !BackgroundImg.height) {
    return null;
  }

  return {
    headline: Title,
    image: { src: strapiMediaUrl(BackgroundImg.url), width: BackgroundImg.width, height: BackgroundImg.height },
    cta,
  };
}

export async function getHomepageHero(): Promise<HeroSlide[]> {
  // 404 means the homepage single type hasn't been created yet — expected, not an error.
  const json = (await strapiFetch(`homepage?${HOMEPAGE_QUERY}`, {
    label: 'homepage',
    fallback: null,
    silentStatuses: [404],
  })) as { data?: { Hero?: unknown } } | null;

  const heroes = json?.data?.Hero;
  if (!Array.isArray(heroes)) {
    return [];
  }

  return heroes.map(normalizeHero).filter((hero): hero is HeroSlide => hero !== null);
}
