export const styles = {
  card: 'group/card relative flex h-full flex-col overflow-hidden rounded-[9px] border border-border bg-white transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(16,24,40,.08)] focus-within:shadow-[0_8px_24px_rgba(16,24,40,.08)] motion-reduce:transition-none',
  link: 'absolute inset-0 z-[1] focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-horizon',
  body: 'flex flex-1 flex-col p-4',
  name: 'mb-1.5 text-base font-bold text-ink',
  priceRow: 'mt-auto flex items-center justify-between gap-2.5',
  price: 'text-base text-ink',
} as const;
