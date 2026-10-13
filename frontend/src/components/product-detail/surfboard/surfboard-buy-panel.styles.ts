export const styles = {
  panel: 'sticky top-24 self-start max-[900px]:static max-[900px]:order-2',
  card: 'rounded-[9px] border border-border px-[22px] pb-6 pt-[22px]',
  field: 'mb-4',
  label: 'mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted',
  selectWrap: 'relative',
  select:
    'w-full appearance-none rounded-[9px] border border-border bg-white py-3 pl-3.5 pr-9 text-[14.5px] font-semibold text-ink disabled:opacity-60',
  chevron: 'pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 fill-none stroke-muted stroke-2',
  buyRow: 'flex flex-wrap items-center justify-between gap-3.5 border-t border-border pt-[18px]',
  price: 'm-0 border-b-2 border-ink pb-0.5 text-2xl font-bold tabular-nums text-ink',
} as const;
