/** My Account classes, after the design's `.acct-*`, `.tab-btn`, `.btn-*` and `.foot-bottom` rules. */
export const styles = {
  page: 'pb-0',
  body: 'flex flex-col',

  hero: 'mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7',
  title:
    'm-0 font-display text-[clamp(28px,4vw,40px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]',
  lede: 'mb-0 mt-2 text-[14.5px] text-muted',

  signOut:
    'flex items-center gap-2 rounded-[9px] border border-border bg-transparent px-[18px] py-[11px] font-mono text-xs uppercase tracking-[0.06em] text-ink hover:border-ink disabled:cursor-default',
  signOutSpinner:
    'h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink motion-reduce:animate-none',

  tabs: 'mb-9 flex gap-2 overflow-x-auto border-b border-border',
  tab: {
    base: 'mr-7 whitespace-nowrap border-b-2 bg-transparent px-1 py-3 text-[13.5px] font-bold uppercase tracking-[0.04em]',
    active: 'border-horizon text-ink',
    inactive: 'border-transparent text-muted',
  },

  form: 'max-w-[560px]',
  row: 'mb-4 flex gap-3.5 max-[480px]:flex-col max-[480px]:gap-4',
  save: 'mt-2 inline-flex items-center justify-center gap-2.5 rounded-[9px] bg-horizon px-[26px] py-[15px] text-center text-[14.5px] font-bold uppercase tracking-[0.03em] text-horizon-ink hover:bg-horizon-deep disabled:cursor-default disabled:opacity-75',
  saveSpinner:
    'h-4 w-4 animate-spin rounded-full border-2 border-horizon-ink/40 border-t-horizon-ink motion-reduce:animate-none',
  note: {
    base: 'mb-0 mt-3.5 text-[12.5px] font-semibold',
    saved: 'text-[#3F7D4F]',
    error: 'text-danger',
  },

  section: 'scroll-mt-24',
  ordersSection: 'mt-14 scroll-mt-24',
  sectionHead: 'mb-5 flex items-baseline justify-between gap-4',
  sectionTitle:
    'm-0 font-display text-[clamp(20px,2.6vw,26px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink',
  count: 'whitespace-nowrap font-mono text-xs uppercase tracking-[0.04em] text-muted',
  empty: 'm-0 max-w-[560px] rounded-[9px] border border-dashed border-border p-8 text-center text-[14.5px] text-muted',
  emptyLink: 'font-bold text-horizon',

  footer: 'mt-10 border-t border-border',
  footerBar: 'flex flex-wrap items-center justify-between gap-3 py-[22px] text-[12.5px] text-muted',
};
