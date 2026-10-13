import Image from 'next/image';
import { ButtonCTA } from '@/shared/components/button-cta';
import type { IHeroSlideProps } from './hero.types';

export const HeroSlide = ({
  slide,
  active,
  visuallyActive = active,
  headingAs: Heading,
  priority = false,
  clone = false,
}: IHeroSlideProps): React.JSX.Element => {
  const hidden = clone || !active;
  // React 18 has no typed `inert` prop; an empty-string attribute is passed through as-is.
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
          visuallyActive
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
          visuallyActive
            ? 'translate-x-0 opacity-100 transition-[opacity,transform] duration-1000 ease-out'
            : 'translate-x-[56px] opacity-0 transition-none'
        }`}
      >
        <Heading className="mb-6 font-display text-[clamp(28px,4.2vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] [text-wrap:balance]">
          {slide.headline}
        </Heading>
        <div className="flex flex-wrap gap-3.5">
          <ButtonCTA {...slide.cta} tabIndex={hidden ? -1 : undefined} />
        </div>
      </div>
    </div>
  );
};
