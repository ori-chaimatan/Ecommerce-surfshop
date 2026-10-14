export const styles = {
  sizeGroup: 'mb-[18px]',
  sizeLabel: 'mb-2.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted',
  sizeGrid: 'grid grid-cols-5 gap-2 max-[420px]:grid-cols-4',
  size: {
    base: 'relative rounded-[9px] border px-1 py-2.5 text-center font-mono text-[13px] font-semibold transition-colors',
    state: {
      soldOut: 'cursor-not-allowed border-border bg-white text-muted line-through',
      selected: 'border-ink bg-ink text-white',
      idle: 'border-border bg-white text-ink hover:border-ink',
    },
  },
  lowStockBadge:
    'absolute -right-1.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-danger text-[10px] font-bold leading-none text-white no-underline',
  lowStockNote: 'mb-0 mt-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.05em] text-danger',
  buy: 'mb-5 mt-[22px]',
  /** Design `.pdp-actions`: Add to Cart beside the wishlist `.btn-wish`. */
  actions: 'flex gap-3',
  error: 'mb-0 mt-2.5 text-[13px] text-danger',
} as const;
