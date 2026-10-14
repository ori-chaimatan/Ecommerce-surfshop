export const styles = {
  backdrop: 'fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(8,16,20,.94)]',
  stage: 'relative h-[min(78vh,860px)] w-[min(88vw,860px)]',
  photo: 'rounded-[9px] bg-background object-contain',
  close: 'absolute -top-[52px] right-0 flex h-9 w-9 items-center justify-center text-white',
  closeIcon: 'h-[26px] w-[26px] fill-none stroke-current stroke-[1.8]',
  arrow: {
    base: 'absolute top-1/2 z-[3] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/[.12] text-white transition-colors hover:bg-white/[.22]',
    side: { previous: '-left-16 max-[900px]:left-2', next: '-right-16 max-[900px]:right-2' },
  },
  arrowIcon: 'h-5 w-5 fill-none stroke-current stroke-2',
  counter: 'absolute -bottom-[34px] left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.04em] text-white',
} as const;
