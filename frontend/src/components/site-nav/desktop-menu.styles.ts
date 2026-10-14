export const styles = {
  nav: 'hidden min-[861px]:block',
  list: 'm-0 flex list-none gap-7 p-0',
  topLink: 'text-[13.5px] font-semibold uppercase tracking-[0.04em] text-ink opacity-[.92] hover:text-horizon',
  panel: {
    base: 'absolute inset-x-0 top-full z-[60] border-t border-border bg-white shadow-[0_20px_40px_rgba(18,33,42,.14)]',
    state: { open: 'block', closed: 'hidden' },
  },
  panelInner: 'mx-auto flex max-w-[1240px] gap-14 px-6 pb-10 pt-9',
  column: 'flex min-w-[180px] flex-col gap-0.5',
  columnHead: 'mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted hover:text-horizon',
  allLink: 'mb-1.5 border-b border-border pb-3 pt-[7px] text-[14.5px] font-bold text-ink hover:text-horizon',
  link: 'py-[7px] text-[14.5px] font-medium text-ink hover:text-horizon',
} as const;
