export const styles = {
  aside: 'max-[900px]:hidden',
  heading: 'mb-3.5 font-mono text-xs uppercase tracking-[0.08em] text-muted',
  item: 'mb-0.5',
  groupToggle: {
    base: 'flex w-full items-center justify-between py-2.5 text-left text-[14.5px] font-bold',
    state: { open: 'text-horizon', closed: 'text-ink' },
  },
  groupChevron: {
    base: 'h-3.5 w-3.5 fill-none stroke-muted stroke-2 transition-transform duration-200',
    state: { open: 'rotate-180', closed: '' },
  },
  groupList: 'mb-2.5 pl-0.5',
  subgroupToggle: {
    base: 'flex w-full items-center justify-between py-1.5 pl-3.5 text-left text-[13.5px] font-bold',
    state: { open: 'text-horizon', closed: 'text-ink' },
  },
  subgroupChevron: {
    base: 'h-3 w-3 shrink-0 fill-none stroke-muted stroke-2 transition-transform duration-200',
    state: { open: 'rotate-180', closed: '' },
  },
  subgroupList: 'mb-1.5',
  link: {
    base: 'block border-l-2 py-1.5',
    indent: { group: 'pl-3.5', subgroup: 'pl-7' },
    state: { active: 'border-horizon font-semibold text-horizon', idle: 'border-transparent text-muted hover:text-ink' },
    size: { group: 'text-[13.5px]', subgroup: 'text-[13px]' },
  },
} as const;
