export const styles = {
  burger: 'flex p-1.5 text-ink min-[861px]:hidden',
  panel: 'fixed inset-x-0 bottom-0 top-16 z-[49] flex flex-col overflow-y-auto bg-ink px-6 pb-6 pt-2 min-[861px]:hidden',
  item: 'border-b border-white/15 py-1',
  itemRow: 'flex items-center justify-between gap-3',
  itemLink: 'flex-1 py-3.5 text-base font-semibold uppercase tracking-[0.04em] text-white',
  toggle: 'flex items-center px-1 py-3.5 text-white',
  chevron: {
    base: 'inline-block text-xl leading-none transition-transform duration-200',
    state: { expanded: 'rotate-90', collapsed: '' },
  },
  group: 'flex flex-col pb-3.5 pl-3.5',
  column: 'flex flex-col',
  columnHead: 'mb-0.5 mt-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white opacity-[.55] first:mt-1',
  link: 'py-[9px] text-sm font-medium text-white opacity-[.85]',
} as const;
