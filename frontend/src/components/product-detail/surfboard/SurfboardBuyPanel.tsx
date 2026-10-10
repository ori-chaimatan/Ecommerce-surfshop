'use client';

import { useState } from 'react';
import { ButtonCTA } from '@/shared/components/button-cta';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { TrustList } from '../shared/TrustList';
import { useAddToCart } from '../shared/use-add-to-cart';
import type { SurfboardDetail } from './surfboard-detail';

interface SurfboardBuyPanelProps {
  documentId: string;
  price: string;
  sizes: SurfboardDetail['sizes'];
  defaultSizeIndex: number;
}

export function SurfboardBuyPanel({ documentId, price, sizes, defaultSizeIndex }: SurfboardBuyPanelProps) {
  const [selected, setSelected] = useState(Math.max(0, defaultSizeIndex));
  const inStock = defaultSizeIndex >= 0;
  const { adding, message, addSize, clearMessage } = useAddToCart(documentId);

  return (
    <div className="sticky top-24 self-start max-[900px]:static max-[900px]:order-2">
      <div className="rounded-[9px] border border-border px-[22px] pb-6 pt-[22px]">
        {sizes.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor="surfboard-dimensions"
              className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted"
            >
              {texts.dimensions}
            </label>
            <div className="relative">
              <select
                id="surfboard-dimensions"
                value={selected}
                disabled={!inStock}
                onChange={(event) => {
                  setSelected(Number(event.target.value));
                  clearMessage();
                }}
                className="w-full appearance-none rounded-[9px] border border-border bg-white py-3 pl-3.5 pr-9 text-[14.5px] font-semibold text-ink disabled:opacity-60"
              >
                {sizes.map((size, index) => (
                  <option key={size.label} value={index} disabled={size.soldOut}>
                    {size.soldOut ? texts.soldOutOption(size.label) : size.label}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 fill-none stroke-[#5B6B72] stroke-2"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-border pt-[18px]">
          <p className="m-0 border-b-2 border-ink pb-0.5 text-2xl font-bold tabular-nums text-ink">{price}</p>
          <ButtonCTA
            text={!inStock ? texts.soldOut : adding ? texts.adding : texts.addToCart}
            disabled={!inStock || adding}
            onClick={() => void addSize(sizes[selected].key)}
          />
        </div>
        {message && (
          <p role="alert" className="mb-0 mt-2.5 text-[13px] text-danger">
            {message}
          </p>
        )}

        <TrustList />
      </div>
    </div>
  );
}
