import type { HeroSlide } from '@/lib/strapi/homepage';

export interface IHeroCarouselProps {
  slides: HeroSlide[];
}

export interface IHeroSlideProps {
  slide: HeroSlide;
  active: boolean;
  /** Runs the zoom and text slide-in. Defaults to `active`; a clone gets it while it's on screen during a wrap. */
  visuallyActive?: boolean;
  /** h1 for the first slide, h2 for the rest; clones use a plain p so the page keeps a single h1. */
  headingAs: 'h1' | 'h2' | 'p';
  priority?: boolean;
  clone?: boolean;
}
