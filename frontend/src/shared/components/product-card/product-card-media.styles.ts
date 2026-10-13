export const styles = {
  frame: 'relative aspect-[4/5] bg-[#F9F9F9]',
  photo: {
    fit: { contain: 'object-contain', cover: 'object-cover' },
    base: 'transition-opacity duration-[250ms] motion-reduce:transition-none',
    state: { active: 'opacity-100', idle: 'opacity-0' },
  },
  favorite:
    'group absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-horizon shadow-[0_1px_4px_rgba(16,24,40,.10)] transition-colors duration-150 hover:border-horizon',
  heart: 'h-[17px] w-[17px] fill-none stroke-current stroke-2 group-aria-pressed:fill-current',
  dots: 'absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/85 px-2 py-1.5 shadow-[0_1px_4px_rgba(16,24,40,.12)]',
  dot: {
    base: "relative h-2 rounded-full transition-[width,background-color] duration-200 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-['']",
    state: { active: 'w-[22px] bg-ink', idle: 'w-2 bg-ink/25' },
  },
} as const;
