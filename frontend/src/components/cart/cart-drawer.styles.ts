export const styles = {
  overlay: 'fixed inset-0 z-[60] animate-fade-in bg-[rgba(18,33,42,.5)] motion-reduce:animate-none',
  drawer:
    'fixed inset-y-0 right-0 z-[61] flex w-[420px] max-w-full animate-drawer-in flex-col bg-white shadow-[-8px_0_24px_rgba(18,33,42,.12)] motion-reduce:animate-none max-[480px]:w-full',
  header: 'flex items-center justify-between border-b border-border px-6 py-5',
  title: 'text-base font-bold text-ink',
  close: 'p-1 text-ink',
  closeIcon: 'h-[18px] w-[18px] fill-none stroke-current stroke-2',
  loading: 'px-6 py-10 text-center text-sm text-muted',
  error: 'flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-muted',
  retry: 'font-bold text-ink underline',
  empty: 'flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-muted',
  continueShopping: 'max-w-[230px]',
  lines: 'flex-1 overflow-y-auto px-6 py-1',
  footer: 'flex flex-col gap-2.5 border-t border-border px-6 py-5',
  subtotalRow: 'mb-1 flex justify-between text-[14.5px] font-bold text-ink',
  subtotal: 'font-mono',
  blocking: 'text-xs text-danger',
} as const;
