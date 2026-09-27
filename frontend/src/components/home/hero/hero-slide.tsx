import Image from 'next/image';
import Link from 'next/link';
import type { HeroSlide as HeroSlideData } from '@/lib/strapi/homepage';

interface HeroSlideProps {
  slide: HeroSlideData;
  active: boolean;
  /** h1 for the first slide, h2 for the rest; clones use a plain p so the page keeps a single h1. */
  headingAs: 'h1' | 'h2' | 'p';
  priority?: boolean;
  clone?: boolean;
}

function isInternal(href: string) {
  return href.startsWith('/') || href.startsWith('#');
}

export function HeroSlide({ slide, active, headingAs: Heading, priority = false, clone = false }: HeroSlideProps) {
  const hidden = clone || !active;
  // React 18 has no typed `inert` prop; an empty-string attribute is passed through as-is.
  const inertProps = hidden ? ({ inert: '' } as Record<string, string>) : {};
  const ctaClassName =
    'inline-flex items-center gap-2 rounded-[9px] border-2 border-transparent bg-horizon px-[26px] py-[14px] text-sm font-bold uppercase tracking-[0.02em] text-horizon-ink no-underline hover:bg-horizon-deep';

  return (
    <div
      data-slide=""
      {...(clone ? { 'data-clone': '' } : {})}
      aria-hidden={hidden ? 'true' : 'false'}
      {...inertProps}
      className="relative flex h-full w-full flex-none items-end justify-start overflow-hidden"
    >
      <div
        className={`absolute inset-0 z-0 origin-[20%_80%] motion-reduce:transform-none ${
          active
            ? 'translate-x-[-2.5%] translate-y-[-1%] scale-[1.08] transition-transform duration-[11s] ease-out'
            : 'transition-none'
        }`}
      >
        <Image
          src={slide.image.src}
          alt=""
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(100deg,rgba(10,20,24,.6)_0%,rgba(10,20,24,.28)_42%,rgba(10,20,24,.05)_68%)]" />
      <div
        className={`relative z-[2] max-w-[760px] px-6 pb-[70px] text-white max-[480px]:px-4 motion-reduce:transform-none motion-reduce:transition-none ${
          active
            ? 'translate-x-0 opacity-100 transition-[opacity,transform] duration-1000 ease-out'
            : 'translate-x-[56px] opacity-0 transition-none'
        }`}
      >
        <Heading className="mb-6 font-display text-[clamp(28px,4.2vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] [text-wrap:balance]">
          {slide.headline}
        </Heading>
        {slide.subtext && <p className="-mt-2 mb-6 max-w-[560px] text-base leading-relaxed text-white/90">{slide.subtext}</p>}
        <div className="flex flex-wrap gap-3.5">
          {isInternal(slide.ctaHref) ? (
            <Link href={slide.ctaHref} tabIndex={hidden ? -1 : undefined} className={ctaClassName}>
              {slide.ctaLabel}
            </Link>
          ) : (
            <a href={slide.ctaHref} tabIndex={hidden ? -1 : undefined} className={ctaClassName}>
              {slide.ctaLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
