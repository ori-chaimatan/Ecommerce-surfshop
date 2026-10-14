/** Shared by the drawer, the cart page and the summary. */
export const sharedStyles = {
  /** Stretches a ButtonCTA (natural width by default) to fill the cart's narrow columns, as in the design. */
  fullWidthCta: '[&>*]:w-full [&>*]:justify-center',
  /** The design's outlined `.btn-cart-secondary` (Continue Shopping). */
  secondaryButton:
    'block w-full rounded-[9px] border-2 border-ink px-5 py-[13px] text-center text-sm font-bold uppercase tracking-[0.03em] text-ink hover:bg-ink hover:text-white',
} as const;
