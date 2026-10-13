export const styles = {
  header: 'border-b border-border pb-5 pt-7',
  container: 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4',
  breadcrumb: 'flex items-center gap-2 font-mono text-xs uppercase tracking-[0.04em] text-muted',
  breadcrumbSeparator: 'opacity-50',
  breadcrumbLink: 'hover:text-horizon',
  breadcrumbCurrent: 'text-ink',
  title:
    'mt-2.5 font-display text-[clamp(30px,4.5vw,52px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]',
  body: 'pb-20 pt-9',
  layout: {
    base: 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4 grid items-start gap-10',
    columns: { withSidebar: 'grid-cols-[248px_1fr] max-[900px]:grid-cols-1', single: 'grid-cols-1' },
  },
  resultsBar: 'mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5',
  resultsCount: 'text-sm text-muted',
  unavailable: 'py-16 text-center text-base text-ink',
  empty: 'py-16 text-center',
  emptyText: 'text-base text-ink',
  emptyLink: 'mt-3 inline-block text-sm font-semibold text-horizon hover:text-horizon-deep',
  grid: 'grid grid-cols-4 gap-5 max-[1080px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-3.5',
} as const;
