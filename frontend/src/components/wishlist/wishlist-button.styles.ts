/** Design `.btn-wish` (standard PDP) and `.btn-outline-sm` (surfboard PDP). Saved = filled heart (design gap: card convention). */
export const styles = {
  variant: {
    icon: 'flex w-[52px] items-center justify-center rounded-[9px] border border-border bg-white text-ink transition-colors hover:border-ink',
    labelled:
      'flex flex-1 items-center justify-center gap-[7px] rounded-[9px] border border-border bg-white px-3 py-[11px] font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink transition-colors hover:border-ink',
  },
  heart: {
    icon: 'h-5 w-5 fill-none stroke-current stroke-[1.8]',
    labelled: 'h-[15px] w-[15px] fill-none stroke-current stroke-[1.8]',
  },
  saved: 'fill-current',
} as const;
