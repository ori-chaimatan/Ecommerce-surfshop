export const styles = {
  nav: 'mt-12 flex items-center justify-center gap-2',
  pageLink: {
    idle: 'flex h-9 min-w-9 items-center justify-center rounded-[9px] border px-2 text-[13px] font-semibold border-border bg-white text-ink hover:border-ink',
    current: 'flex h-9 min-w-9 items-center justify-center rounded-[9px] border px-2 text-[13px] font-semibold border-ink bg-ink text-white',
  },
} as const;
