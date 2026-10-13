import Link from 'next/link';
import { isInternalHref } from './button-cta';
import type { IButtonCTAProps } from './button-cta.types';
import { styles } from './button-cta.styles';

export const ButtonCTA = ({ text, href, target = '_self', size = 'md', tabIndex }: IButtonCTAProps): React.JSX.Element => {
  const className = `${styles.shape} ${styles.size[size]} ${styles.type}`;
  const targetProps = target === '_blank' ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return isInternalHref(href) ? (
    <Link href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </Link>
  ) : (
    <a href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </a>
  );
};
