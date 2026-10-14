/**
 * Design profile.html `#panelOrders` layout, with the design system v0.4 applied: numbers in
 * JetBrains Mono, the system pill (border + dot), type scale 12 · 14 · 22.
 */
export const styles = {
  section: 'mt-14 scroll-mt-24',
  head: 'mb-5 flex items-baseline justify-between gap-4',
  title:
    'm-0 font-display text-[22px] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink',
  empty: 'm-0 max-w-[560px] rounded-[9px] border border-dashed border-border p-8 text-center text-sm text-muted',

  list: 'flex max-w-[760px] flex-col gap-3.5',
  card: 'overflow-hidden rounded-[9px] border border-border bg-white',
  summary: 'flex w-full flex-wrap items-center gap-4 bg-transparent px-5 py-4 text-left text-ink',
  preview: 'relative h-[52px] w-[52px] flex-none overflow-hidden rounded-[9px] bg-surface',
  main: 'min-w-0 flex-[1_1_140px]',
  number: 'font-mono text-sm font-bold',
  date: 'mt-[3px] font-mono text-xs text-muted',
  count: 'flex-none font-mono text-xs text-muted max-[600px]:hidden',
  // Design system pill: 1px border, mono label, a Horizon or Sand dot.
  status: {
    base: 'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-[20px] border border-border bg-white px-3 py-1.5 font-mono text-xs text-ink',
    dot: 'h-1.5 w-1.5 rounded-full',
    delivered: 'bg-horizon',
    shipped: 'bg-horizon',
    processing: 'bg-sand',
    cancelled: 'bg-sand',
  },
  right: 'ml-auto flex flex-none items-center gap-4',
  total: 'font-mono text-sm font-bold',
  chevron: {
    base: 'h-4 w-4 fill-none stroke-muted stroke-2 transition-transform duration-200 motion-reduce:transition-none',
    open: 'rotate-180',
  },

  // grid-template-rows 0fr → 1fr animates to the content's height; an inline visibility keeps closed panels out of tab order.
  detail: {
    base: 'grid transition-[grid-template-rows,visibility] duration-[250ms] ease-in-out motion-reduce:transition-none',
    open: 'grid-rows-[1fr]',
    closed: 'grid-rows-[0fr]',
  },
  detailClip: 'overflow-hidden',
  detailInner: 'border-t border-border px-5 pb-[22px] pt-1',
  items: 'mt-[18px] flex list-none flex-col gap-3.5 p-0',
  item: 'flex items-center gap-3.5',
  thumb: 'relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-[9px] bg-surface font-mono text-xs font-bold text-muted',
  name: 'text-sm font-semibold text-ink',
  spec: 'mt-0.5 font-mono text-xs text-muted',
  price: 'ml-auto flex-none pl-3 font-mono text-sm font-bold text-ink',
  totals: 'ml-auto mt-[18px] flex max-w-[280px] flex-col gap-2 border-t border-border pt-4',
  totalsRow: 'flex justify-between text-xs text-muted',
  totalsValue: 'font-mono',
  totalsGrand: 'flex justify-between border-t border-border pt-2 text-sm font-bold text-ink',

  note: 'mb-0 mt-5 max-w-[560px] text-xs font-semibold text-muted',
} as const;
