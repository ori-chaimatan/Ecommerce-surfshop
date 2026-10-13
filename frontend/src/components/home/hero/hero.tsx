import { getHomepageHero } from '@/lib/strapi/homepage';
import { HeroCarousel } from './hero-carousel';
import { HeroFallback } from './hero-fallback';

export async function Hero() {
  const slides = await getHomepageHero();

  if (slides.length === 0) {
    return <HeroFallback />;
  }

  return <HeroCarousel slides={slides} />;
}
