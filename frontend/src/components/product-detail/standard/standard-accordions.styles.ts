export const styles = {
  accordions: 'mt-8',
  group: 'border-b border-border',
  header: 'flex w-full items-center justify-between py-5 text-left text-[15px] font-bold text-ink',
  chevron: {
    base: 'h-4 w-4 shrink-0 fill-none stroke-muted stroke-2 transition-transform duration-200',
    state: { open: 'rotate-180', closed: '' },
  },
  panel:
    'pb-[22px] text-[14.5px] leading-[1.7] text-muted [&_li]:mb-1.5 [&_li]:list-disc [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_strong]:text-ink [&_ul]:pl-[18px]',
} as const;
