import { texts } from './cart-texts';

interface ShippingProgressProps {
  /** Formatted amount still needed; null once free shipping is unlocked. */
  remaining: string | null;
  /** 0–1. */
  progress: number;
  variant: 'drawer' | 'page';
}

export function ShippingProgress({ remaining, progress, variant }: ShippingProgressProps) {
  const percent = Math.round(progress * 100);
  const page = variant === 'page';

  return (
    <div
      className={
        page
          ? 'mb-5 flex flex-col gap-2 rounded-[9px] bg-surface px-[18px] py-4 text-[13px] text-ink'
          : 'flex flex-col gap-2 border-b border-border px-6 py-3.5 text-[12.5px] text-muted'
      }
    >
      <p>{remaining ? texts.remaining(remaining) : texts.unlocked}</p>
      <div
        role="progressbar"
        aria-label={texts.freeShippingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={`${page ? 'h-[5px]' : 'h-1'} overflow-hidden rounded-full bg-border`}
      >
        <div
          className="h-full rounded-full bg-horizon transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
