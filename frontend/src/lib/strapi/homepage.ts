const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

const HOMEPAGE_QUERY = new URLSearchParams({
  'populate[Hero][populate][BackgroundImg]': 'true',
  'populate[Hero][populate][Button]': 'true',
}).toString();

export interface HeroSlide {
  headline: string;
  subtext?: string;
  image: { src: string; width: number; height: number };
  ctaLabel: string;
  ctaHref: string;
}

interface StrapiHero {
  Title?: string | null;
  BackgroundImg?: { url?: string; width?: number; height?: number } | null;
  Button?: { Text?: string | null; LinkUrl?: string | null } | null;
}

function absoluteUrl(url: string) {
  return url.startsWith('/') ? `${STRAPI_URL}${url}` : url;
}

function normalizeHero(hero: StrapiHero): HeroSlide | null {
  const { Title, BackgroundImg, Button } = hero ?? {};
  if (!Title || !Button?.Text || !Button?.LinkUrl || !BackgroundImg?.url || !BackgroundImg.width || !BackgroundImg.height) {
    return null;
  }

  return {
    headline: Title,
    image: { src: absoluteUrl(BackgroundImg.url), width: BackgroundImg.width, height: BackgroundImg.height },
    ctaLabel: Button.Text,
    ctaHref: Button.LinkUrl,
  };
}

export async function getHomepageHero(): Promise<HeroSlide[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/homepage?${HOMEPAGE_QUERY}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status !== 404) {
        console.error(`[homepage] Strapi responded ${response.status}`);
      }
      return [];
    }

    const json = await response.json();
    const heroes = json?.data?.Hero;
    if (!Array.isArray(heroes)) {
      return [];
    }

    return heroes.map(normalizeHero).filter((hero): hero is HeroSlide => hero !== null);
  } catch (error) {
    console.error('[homepage] failed to load hero slides', error);
    return [];
  }
}
