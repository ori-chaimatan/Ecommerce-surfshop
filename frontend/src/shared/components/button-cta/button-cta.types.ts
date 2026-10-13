import type { ButtonCtaTarget } from './button-cta';

export type ButtonCtaSize = 'sm' | 'md' | 'lg';

interface IButtonCTABaseProps {
  text: string;
  size?: ButtonCtaSize;
  tabIndex?: number;
}

/** With `href`: a link (navigation). Without it: an action button (`onClick`, optionally `disabled`). */
export type IButtonCTAProps = IButtonCTABaseProps &
  (
    | { href: string; target?: ButtonCtaTarget; onClick?: never; disabled?: never }
    | { href?: undefined; target?: never; onClick?: () => void; disabled?: boolean }
  );
