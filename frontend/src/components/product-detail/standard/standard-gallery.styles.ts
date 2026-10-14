// Every photo sits in the same fixed 4:5 frame, never sized from the photo, so nothing shifts as images load.
// Desktop: a 2-up grid that scrolls past the sticky buy column. ≤900px: a full-width scroll-snap swipe.
export const styles = {
  gallery: 'min-w-0',
  grid: 'grid grid-cols-2 gap-[3px] max-[900px]:flex max-[900px]:gap-0 max-[900px]:overflow-x-auto max-[900px]:snap-x max-[900px]:snap-mandatory max-[900px]:[scrollbar-width:none] max-[900px]:[&::-webkit-scrollbar]:hidden',
  frame: {
    base: 'relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-background max-[900px]:flex-[0_0_100%] max-[900px]:snap-center max-[900px]:snap-always',
    span: { single: 'col-span-2', many: '' },
  },
  photo: 'object-contain transition-opacity duration-200 hover:opacity-[.92]',
} as const;
