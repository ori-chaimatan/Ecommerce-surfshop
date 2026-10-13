import { CONTAINER } from '../shared/layout';
import { TrustList } from '../shared/TrustList';
import type { StandardDetail } from './standard-detail';
import { StandardAccordions } from './StandardAccordions';
import { StandardBuyPanel } from './StandardBuyPanel';
import { StandardGallery } from './StandardGallery';

interface StandardProductDetailProps {
  detail: StandardDetail;
}

export function StandardProductDetail({ detail }: StandardProductDetailProps) {
  return (
    <section className="pb-16">
      <div className={`${CONTAINER} grid grid-cols-[1.6fr_1fr] items-start gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-7`}>
        <StandardGallery images={detail.images} name={detail.name} />

        <div className="sticky top-[88px] flex flex-col self-start max-[900px]:static">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon">{detail.category.name}</span>
          <h1 className="mb-3 mt-2.5 font-display text-[clamp(26px,3.4vw,38px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]">
            {detail.name}
          </h1>
          <p className="mb-4 mt-2.5 text-2xl font-bold tabular-nums text-ink">{detail.price}</p>
          <StandardBuyPanel sizes={detail.sizes} defaultSizeIndex={detail.defaultSizeIndex} />
          <TrustList />
          <StandardAccordions markdown={detail.descriptionMarkdown} />
        </div>
      </div>
    </section>
  );
}
