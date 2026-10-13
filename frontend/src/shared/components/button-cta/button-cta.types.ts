import type { ButtonCtaTarget } from './button-cta';

export type ButtonCtaSize = 'sm' | 'md' | 'lg';

export interface IButtonCTAProps {
  text: string;
  href: string;
  target?: ButtonCtaTarget;
  size?: ButtonCtaSize;
  tabIndex?: number;
}
