/**
 * My Account classes: the design's `.acct-*` layout, with colours, fonts and sizes from the
 * design system v0.4 (type scale 12 · 14 · 17 · 22 · 32; secondary button; Horizon as the positive colour).
 */
export const styles = {
  page: 'pb-0',
  body: 'flex flex-col',

  hero: 'mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7',
  title:
    'm-0 font-display text-[32px] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]',
  lede: 'mb-0 mt-2 text-sm text-muted',

  // Design system secondary button: transparent, 2px Ink border, Ink text.
  signOut:
    'flex items-center gap-2 rounded-[9px] border-2 border-ink bg-transparent px-[26px] py-3 text-sm font-bold uppercase tracking-[0.02em] text-ink disabled:cursor-default disabled:opacity-75',
  signOutSpinner:
    'h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/25 border-t-ink motion-reduce:animate-none',

  tabs: 'mb-9 flex gap-2 overflow-x-auto border-b border-border',
  tab: {
    base: 'mr-7 whitespace-nowrap border-b-2 bg-transparent px-1 py-3 text-sm font-bold uppercase tracking-[0.04em]',
    active: 'border-horizon text-ink',
    inactive: 'border-transparent text-muted',
  },

  form: 'max-w-[560px]',
  row: 'mb-4 flex gap-3.5 max-[480px]:flex-col max-[480px]:gap-4',
  // Design system primary button.
  save: 'mt-2 inline-flex items-center justify-center gap-2.5 rounded-[9px] border-2 border-transparent bg-horizon px-[26px] py-3.5 text-center text-sm font-bold uppercase tracking-[0.02em] text-horizon-ink hover:bg-horizon-deep disabled:cursor-default disabled:opacity-75',
  saveSpinner:
    'h-4 w-4 animate-spin rounded-full border-2 border-horizon-ink/40 border-t-horizon-ink motion-reduce:animate-none',
  note: {
    base: 'mb-0 mt-3.5 text-xs font-semibold',
    // Horizon is the design system's positive colour (it has no green).
    saved: 'text-horizon',
    error: 'text-danger',
  },


  footer: 'mt-10 border-t border-border',
  footerBar: 'flex flex-wrap items-center justify-between gap-3 py-[22px] text-xs text-muted',
};
