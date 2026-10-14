export const styles = {
  page: 'pb-20',
  title: 'mb-7 mt-1 font-display text-[clamp(28px,4vw,42px)] font-extrabold uppercase leading-[0.95] text-ink',
  skeleton: 'grid grid-cols-[1.7fr_1fr] gap-12 max-[900px]:grid-cols-1',
  skeletonColumn: 'flex flex-col gap-6',
  skeletonBlock: {
    base: 'animate-pulse rounded-[9px] bg-surface motion-reduce:animate-none',
    height: { banner: 'h-16', line: 'h-[138px]', summary: 'h-72' },
  },
  message: 'flex flex-col items-start gap-4 py-12',
  messageText: 'text-[15px] text-muted',
  retry: 'font-bold text-ink underline',
  continueShopping: 'max-w-[220px]',
  grid: 'grid grid-cols-[1.7fr_1fr] items-start gap-12 max-[900px]:grid-cols-1',
} as const;
