/** Design profile.html `#panelOrders`: `.order-list`, `.order-card`, `.order-summary`, `.order-status`, `.order-detail`, `.order-items`, `.order-totals`. */
export const styles = {
  section: 'mt-14 scroll-mt-24',
  head: 'mb-5 flex items-baseline justify-between gap-4',
  title:
    'm-0 font-display text-[clamp(20px,2.6vw,26px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink',
  empty: 'm-0 max-w-[560px] rounded-[9px] border border-dashed border-border p-8 text-center text-[14.5px] text-muted',

  list: 'flex max-w-[760px] flex-col gap-3.5',
  card: 'overflow-hidden rounded-[9px] border border-border bg-white',
  summary: 'flex w-full flex-wrap items-center gap-4 bg-transparent px-5 py-4 text-left text-ink',
  preview: 'relative h-[52px] w-[52px] flex-none overflow-hidden rounded-[9px] bg-surface',
  main: 'min-w-0 flex-[1_1_140px]',
  number: 'font-mono text-[14.5px] font-bold',
  date: 'mt-[3px] text-[12.5px] text-muted',
  count: 'flex-none text-[13px] text-muted max-[600px]:hidden',
  status: {
    base: 'flex-none whitespace-nowrap rounded-[20px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em]',
    delivered: 'bg-[rgba(63,125,79,.12)] text-[#3F7D4F]',
    shipped: 'bg-horizon/[.12] text-horizon',
    processing: 'bg-surface text-muted',
    cancelled: 'bg-surface text-muted',
  },
  right: 'ml-auto flex flex-none items-center gap-4',
  total: 'text-[15px] font-bold',
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
  thumb: 'relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-[9px] bg-surface font-mono text-[11px] font-bold text-muted',
  name: 'text-[13.5px] font-semibold text-ink',
  spec: 'mt-0.5 font-mono text-[11.5px] text-muted',
  price: 'ml-auto flex-none pl-3 text-[13.5px] font-bold text-ink',
  totals: 'ml-auto mt-[18px] flex max-w-[280px] flex-col gap-2 border-t border-border pt-4',
  totalsRow: 'flex justify-between text-[13px] text-muted',
  totalsGrand: 'flex justify-between border-t border-border pt-2 text-[14.5px] font-bold text-ink',

  note: 'mb-0 mt-5 max-w-[560px] text-[12.5px] font-semibold text-muted',
} as const;
