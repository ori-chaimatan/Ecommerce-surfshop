/** Design profile.html `#panelWishlist`: `.acct-section-head`, `.wish-slider-wrap`, `.wish-grid`, `.slider-arrow`, `.wish-empty`, `.wish-toast`. */
export const styles = {
  section: 'scroll-mt-24',
  head: 'mb-5 flex items-baseline justify-between gap-4',
  title:
    'm-0 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink',
  count: 'whitespace-nowrap font-mono text-xs uppercase tracking-[0.04em] text-muted',

  wrap: 'flex items-center gap-4',
  grid: 'flex min-w-0 flex-auto snap-x snap-mandatory gap-5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  item: {
    base: 'shrink-0 grow-0 snap-start transition-[opacity,transform] duration-[250ms] motion-reduce:transition-none',
    removing: 'scale-[.96] opacity-0',
  },
  arrow: {
    base: 'flex h-9 w-9 flex-none items-center justify-center rounded-full border border-border bg-white shadow-[0_2px_8px_rgba(0,0,0,.1)] max-[640px]:hidden',
    hidden: 'pointer-events-none invisible',
  },
  arrowIcon: 'h-4 w-4 fill-none stroke-ink stroke-2',

  empty: 'm-0 max-w-[560px] rounded-[9px] border border-dashed border-border p-8 text-center text-sm text-muted',
  emptyLink: 'font-bold text-horizon',

  toast: {
    base: 'pointer-events-none fixed bottom-6 left-1/2 z-[80] m-0 -translate-x-1/2 rounded-[9px] bg-ink px-[22px] py-3 text-sm text-white transition-[opacity,transform] duration-200 motion-reduce:transition-none',
    visible: 'translate-y-0 opacity-100',
    hidden: 'translate-y-5 opacity-0',
  },
} as const;
