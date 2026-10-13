import { getHomepageHero } from '@/lib/strapi/homepage';
import { HeroCarousel } from './HeroCarousel';
import { HeroFallback } from './HeroFallback';

export async function Hero() {
  const slides = await getHomepageHero();

  return slides.length === 0 ? <HeroFallback /> : <HeroCarousel slides={slides} />;
}
