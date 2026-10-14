/** The signed-in account dropdown (no design; built from the site's tokens). */
export const styles = {
  root: 'relative',
  trigger: 'flex p-1.5 text-horizon hover:text-horizon-deep',
  menu: 'absolute right-0 top-full z-[60] mt-2 w-44 rounded-[9px] border border-border bg-white py-1.5 shadow-[0_12px_32px_rgba(18,33,42,.14)]',
  item: 'block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-surface hover:text-horizon disabled:opacity-60',
  divider: 'mt-1.5 border-t border-border pt-1.5',
} as const;
