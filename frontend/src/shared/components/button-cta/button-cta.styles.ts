import type { ButtonCtaSize } from './button-cta.types';

export const styles = {
  shape: 'inline-flex items-center gap-2 rounded-[9px] border-2 border-transparent bg-horizon',
  // md is the design's hero button. sm and lg are provisional (no design yet): they change only padding and font size.
  size: {
    sm: 'px-[18px] py-[10px] text-xs',
    md: 'px-[26px] py-[14px] text-sm',
    lg: 'px-[32px] py-[18px] text-base',
  } satisfies Record<ButtonCtaSize, string>,
  type: 'font-bold uppercase tracking-[0.02em] text-horizon-ink no-underline hover:bg-horizon-deep',
  // Action-button mode only.
  disabled: 'disabled:cursor-not-allowed disabled:bg-muted',
} as const;
