'use client';

import { useId, useState } from 'react';
import { ButtonCTA } from '@/shared/components/button-cta';
import { texts } from '../product-detail-texts';
import type { StandardDetail } from './standard-detail';

const SIZE_BOX = 'relative rounded-[9px] border px-1 py-2.5 text-center font-mono text-[13px] font-semibold transition-colors';
const SIZE_STATE = {
  soldOut: 'cursor-not-allowed border-border bg-white text-muted line-through',
  selected: 'border-ink bg-ink text-white',
  idle: 'border-border bg-white text-ink hover:border-ink',
};

interface StandardBuyPanelProps {
  sizes: StandardDetail['sizes'];
  defaultSizeIndex: number;
}

export function StandardBuyPanel({ sizes, defaultSizeIndex }: StandardBuyPanelProps) {
  const [selected, setSelected] = useState(defaultSizeIndex);
  const labelId = useId();
  const inStock = defaultSizeIndex >= 0;
  const current = selected >= 0 ? sizes[selected] : undefined;

  return (
    <div>
      {sizes.length > 0 && (
        <div role="group" aria-labelledby={labelId} className="mb-[18px]">
          <span id={labelId} className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            {current ? texts.standard.selectedSize(current.label) : texts.standard.size}
          </span>
          <div className="grid grid-cols-5 gap-2 max-[420px]:grid-cols-4">
            {sizes.map((size, index) => (
              <button
                key={size.label}
                type="button"
                disabled={size.soldOut}
                aria-pressed={index === selected}
                aria-label={
                  size.soldOut
                    ? texts.standard.soldOutSize(size.label)
                    : size.lowStock
                      ? texts.standard.lowStockSize(size.label)
                      : undefined
                }
                onClick={() => setSelected(index)}
                className={`${SIZE_BOX} ${size.soldOut ? SIZE_STATE.soldOut : index === selected ? SIZE_STATE.selected : SIZE_STATE.idle}`}
              >
                {size.label}
                {size.lowStock && (
                  <span
                    aria-hidden
                    className="absolute -right-1.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-danger text-[10px] font-bold leading-none text-white no-underline"
                  >
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
          {current?.lowStock && (
            <p className="mb-0 mt-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.05em] text-danger">
              {texts.standard.lowStock}
            </p>
          )}
        </div>
      )}

      <div className="mb-5 mt-[22px]">
        <ButtonCTA text={inStock ? texts.addToCart : texts.soldOut} disabled={!inStock} />
      </div>
    </div>
  );
}
