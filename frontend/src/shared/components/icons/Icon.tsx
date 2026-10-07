import type { SVGProps } from 'react';

export type IconName = 'heart' | 'account' | 'cart' | 'arrow-left' | 'arrow-right' | 'chevron-down' | 'close' | 'return' | 'clock';

// 24×24 shapes from the WESTLINE design. Size, stroke and fill come from the caller.
const SHAPES: Record<IconName, JSX.Element> = {
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" />
    </>
  ),
  cart: (
    <>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  'arrow-left': <path d="M15 18l-6-6 6-6" />,
  'arrow-right': <path d="M9 6l6 6-6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  return: (
    <>
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M5 15a8 8 0 0014 3l1 2M19 9A8 8 0 005 6L4 4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> {
  name: IconName;
}

/** Decorative icon — the control around it carries the accessible name. */
export function Icon({ name, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      {SHAPES[name]}
    </svg>
  );
}
