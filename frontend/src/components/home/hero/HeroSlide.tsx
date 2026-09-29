import Image from 'next/image';
import type { HeroSlide as HeroSlideData } from '@/lib/strapi/homepage';
import { ButtonCTA } from '@/shared/components/button-cta';

interface HeroSlideProps {
  slide: HeroSlideData;
  active: boolean;
  headingAs: 'h1' | 'h2' | 'p';
  priority?: boolean;
  clone?: boolean;
}

export function HeroSlide({ slide, active, headingAs: Heading, priority = false, clone = false }: HeroSlideProps) {
  const hidden = clone || !active;
  const inertProps = hidden ? ({ inert: '' } as Record<string, string>) : {};

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
          <ButtonCTA {...slide.cta} tabIndex={hidden ? -1 : undefined} />
        </div>
      </div>
    </div>
  );
}
