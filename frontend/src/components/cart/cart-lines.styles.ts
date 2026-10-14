const price = { blocked: 'text-muted line-through', normal: 'text-ink' } as const;

export const styles = {
  lines: 'flex flex-col',
  removedNote: 'py-3 text-[13px] text-muted',
  error: 'py-3 text-[13px] text-danger',
  list: 'flex flex-col',
  row: { base: 'flex border-b border-border', variant: { page: 'gap-5 py-6', drawer: 'gap-3.5 py-4' } },
  photo: {
    base: 'relative shrink-0 overflow-hidden rounded-[9px] bg-surface',
    variant: { page: 'h-[138px] w-[110px]', drawer: 'h-[95px] w-[76px]' },
  },
  image: { contain: 'object-contain', cover: 'object-cover' },
  details: { base: 'flex flex-1 flex-col', variant: { page: 'gap-1.5', drawer: 'gap-1' } },
  nameRow: 'flex justify-between gap-3',
  name: { base: 'font-bold text-ink hover:text-horizon', variant: { page: 'text-base', drawer: 'text-sm' } },
  pageTotal: { base: 'whitespace-nowrap font-mono text-[15px] font-semibold', price },
  sizeLabel: { base: 'text-muted', variant: { page: 'text-[13px]', drawer: 'text-[12.5px]' } },
  note: 'font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-danger',
  actions: { base: 'flex items-center justify-between gap-3', variant: { page: 'mt-auto pt-2', drawer: 'mt-2' } },
  stepper: 'flex items-center rounded-[9px] border border-border',
  step: {
    base: 'flex items-center justify-center text-ink hover:text-horizon disabled:cursor-not-allowed disabled:opacity-40',
    variant: { page: 'h-8 w-8', drawer: 'h-[26px] w-[26px]' },
  },
  stepIcon: 'h-3.5 w-3.5 fill-none stroke-current stroke-2',
  quantity: { base: 'text-center font-mono', variant: { page: 'min-w-[26px] text-sm', drawer: 'min-w-5 text-[13px]' } },
  pageRemove: 'ml-auto text-[12.5px] text-muted underline underline-offset-[3px] hover:text-ink disabled:opacity-40',
  drawerTotal: { base: 'ml-auto font-mono text-[13.5px] font-semibold', price },
  drawerRemove: 'mt-1.5 self-start text-xs text-muted underline hover:text-ink disabled:opacity-40',
} as const;
