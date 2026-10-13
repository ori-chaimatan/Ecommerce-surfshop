export const styles = {
  card: 'relative flex h-full flex-col overflow-hidden rounded-[9px] border border-border bg-white',
  link: 'absolute inset-0 z-[1] focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-horizon',
  body: 'flex flex-1 flex-col p-4',
  name: 'mb-1.5 text-base font-bold text-ink',
  priceRow: 'mt-auto flex items-center justify-between gap-2.5',
  price: 'text-base text-ink',
} as const;
