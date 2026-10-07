import Link from 'next/link';
import type { ButtonCtaTarget } from './button-cta';

type ButtonCtaSize = 'sm' | 'md' | 'lg';

interface ButtonCTABaseProps {
  text: string;
  size?: ButtonCtaSize;
  tabIndex?: number;
}

/** With `href`: a link (navigation). Without it: an action button (`onClick`, optionally `disabled`). */
type ButtonCTAProps = ButtonCTABaseProps &
  (
    | { href: string; target?: ButtonCtaTarget; onClick?: never; disabled?: never }
    | { href?: undefined; target?: never; onClick?: () => void; disabled?: boolean }
  );

const SIZE_CLASSES: Record<ButtonCtaSize, string> = {
  sm: 'px-[18px] py-[10px] text-xs',
  md: 'px-[26px] py-[14px] text-sm',
  lg: 'px-[32px] py-[18px] text-base',
};

const DISABLED_CLASSES = 'disabled:cursor-not-allowed disabled:bg-muted';

function isInternal(href: string) {
  return href.startsWith('/') || href.startsWith('#');
}

export function ButtonCTA({ text, href, target = '_self', size = 'md', tabIndex, onClick, disabled }: ButtonCTAProps) {
  const className = `inline-flex items-center gap-2 rounded-[9px] border-2 border-transparent bg-horizon ${SIZE_CLASSES[size]} font-bold uppercase tracking-[0.02em] text-horizon-ink no-underline hover:bg-horizon-deep`;
  const targetProps = target === '_blank' ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return href === undefined ? (
    <button type="button" tabIndex={tabIndex} onClick={onClick} disabled={disabled} className={`${className} ${DISABLED_CLASSES}`}>
      {text}
    </button>
  ) : isInternal(href) ? (
    <Link href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </Link>
  ) : (
    <a href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </a>
  );
}
