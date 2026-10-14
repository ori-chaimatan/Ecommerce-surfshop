export const styles = {
  progress: {
    page: 'mb-5 flex flex-col gap-2 rounded-[9px] bg-surface px-[18px] py-4 text-[13px] text-ink',
    drawer: 'flex flex-col gap-2 border-b border-border px-6 py-3.5 text-[12.5px] text-muted',
  },
  track: { base: 'overflow-hidden rounded-full bg-border', height: { page: 'h-[5px]', drawer: 'h-1' } },
  fill: 'h-full rounded-full bg-horizon transition-[width] duration-300 motion-reduce:transition-none',
} as const;
