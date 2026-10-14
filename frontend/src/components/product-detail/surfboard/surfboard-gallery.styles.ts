export const styles = {
  gallery: 'sticky top-24 flex items-center gap-3.5 self-start max-[900px]:static max-[900px]:order-1 max-[900px]:gap-2',
  navButton:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-ink',
  navIcon: 'h-4 w-4 fill-none stroke-ink stroke-2',
  // A fixed frame: column width × 74vh (the tallest a board photo may be), never derived from the photo,
  // so flipping photos moves nothing — the photo is centred inside with object-contain.
  frame: 'relative h-[74vh] w-full min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-[9px] bg-background',
  photo: 'object-contain',
} as const;
