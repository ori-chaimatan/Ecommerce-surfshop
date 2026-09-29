import Link from 'next/link';
import type { ButtonCtaTarget } from './button-cta';

type ButtonCtaSize = 'sm' | 'md' | 'lg';

interface ButtonCTAProps {
  text: string;
  href: string;
  target?: ButtonCtaTarget;
  size?: ButtonCtaSize;
  tabIndex?: number;
}

const SIZE_CLASSES: Record<ButtonCtaSize, string> = {
  sm: 'px-[18px] py-[10px] text-xs',
  md: 'px-[26px] py-[14px] text-sm',
  lg: 'px-[32px] py-[18px] text-base',
};

function isInternal(href: string) {
  return href.startsWith('/') || href.startsWith('#');
}

export function ButtonCTA({ text, href, target = '_self', size = 'md', tabIndex }: ButtonCTAProps) {
  const className = `inline-flex items-center gap-2 rounded-[9px] border-2 border-transparent bg-horizon ${SIZE_CLASSES[size]} font-bold uppercase tracking-[0.02em] text-horizon-ink no-underline hover:bg-horizon-deep`;
  const targetProps = target === '_blank' ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return isInternal(href) ? (
    <Link href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </Link>
  ) : (
    <a href={href} tabIndex={tabIndex} className={className} {...targetProps}>
      {text}
    </a>
  );
}
