/** Design index.html `footer`, `.foot-grid`, `.foot-brand`, `.foot-col`, `.foot-bottom`, on the design system type scale. */
export const styles = {
  footer: 'border-t border-border bg-white pb-7 pt-14',
  container: 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4',
  grid: 'mb-10 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 max-[760px]:grid-cols-2',
  wordmark: 'm-0 font-display text-[22px] font-extrabold tracking-[0.02em] text-ink',
  tagline: 'mb-0 mt-2.5 max-w-[32ch] text-sm text-muted',
  columnTitle: 'mb-3.5 mt-0 font-mono text-xs font-normal uppercase tracking-[0.08em] text-muted',
  list: 'm-0 flex list-none flex-col gap-2.5 p-0',
  link: 'text-sm text-ink no-underline hover:text-horizon',
  bottom: 'flex flex-wrap items-center justify-between gap-3 border-t border-border pt-[22px] text-xs text-muted',
  legal: 'm-0 flex list-none gap-[18px] p-0',
  legalLink: 'text-muted no-underline hover:text-ink',
  // Fallback: just the bottom bar, without its own border.
  fallback: 'flex flex-wrap items-center justify-between gap-3 text-xs text-muted',
  fallbackWordmark: 'font-display text-base font-extrabold tracking-[0.02em] text-ink',
} as const;
