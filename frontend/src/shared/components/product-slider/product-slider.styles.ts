/** Design `.prod-slider`, `.prod-grid`, `.prod-arrow`, `.prod-dots` (index.html Featured gear and the product pages' "You might also like"). */
export const styles = {
  // Arrow room: on desktop only when more than 4 products overflow (Ori's decision); always at ≤980px, as designed.
  slider: {
    base: 'relative max-[980px]:px-[52px] max-[480px]:px-[46px]',
    overflowing: 'px-[52px]',
  },
  track:
    'flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] max-[980px]:gap-4 [&::-webkit-scrollbar]:hidden',
  item: 'flex-[0_0_calc((100%-60px)/4)] snap-start max-[980px]:flex-[0_0_calc((100%-16px)/2)] max-[520px]:flex-[0_0_100%]',
  arrow: {
    base: 'absolute top-[40%] z-[3] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-[0_2px_10px_rgba(16,24,40,.12)] max-[480px]:h-9 max-[480px]:w-9',
    prev: 'left-0',
    next: 'right-0',
  },
  arrowIcon: 'h-[18px] w-[18px] fill-none stroke-ink stroke-2',
  dots: 'mt-5 flex justify-center gap-2',
  // Design `.slider-dot`: 8px, the current one 22px Ink; a wider invisible hit area.
  dot: {
    base: "relative h-2 rounded-full border-0 p-0 transition-[width,background-color] duration-200 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] motion-reduce:transition-none",
    current: 'w-[22px] bg-ink',
    idle: 'w-2 bg-border',
  },
} as const;
