import type { SVGProps } from 'react';

export type IconName = 'heart' | 'account' | 'cart' | 'arrow-left' | 'arrow-right' | 'chevron-down' | 'close' | 'return' | 'clock' | 'plus' | 'minus';

export interface IIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox'> {
  name: IconName;
}
