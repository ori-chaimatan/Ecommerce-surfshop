import Link from 'next/link';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/strapi/product';
import { texts } from './product-detail-texts';
import { SCALE_MAX, SCALE_MIN, buildBreadcrumb, toSurfboardDetail } from './surfboard-detail';
import { SurfboardBuyPanel } from './SurfboardBuyPanel';
import { SurfboardDescription } from './SurfboardDescription';
import { SurfboardGallery } from './SurfboardGallery';

const CONTAINER = 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4';

// Each label is a third of the track wide, anchored at its true point: start at 0%, middle centred on 50%, end at 100%.
const SCALE_LABEL_POSITION = {
  start: 'left-0 text-left',
  middle: 'left-1/2 -translate-x-1/2 text-center',
  end: 'right-0 text-right',
};

function scalePositions(count: number): (keyof typeof SCALE_LABEL_POSITION)[] {
  return count === 3 ? ['start', 'middle', 'end'] : ['start', 'end'];
}

interface ProductDetailPageProps {
  productSlug: string;
}

export async function ProductDetailPage({ productSlug }: ProductDetailPageProps) {
  const result = await getProductBySlug(productSlug);
  if (result.kind === 'not-found') notFound();

  // Unavailable renders a 200 with a message; a product that isn't a valid surfboard is a 404 (AC3, AC4).
  const detail = result.kind === 'ok' ? toSurfboardDetail(result.product) : null;
  if (result.kind === 'ok' && !detail) notFound();

  const breadcrumb = buildBreadcrumb(detail);

  return (
    <main>
      <div className={CONTAINER}>
        <nav
          aria-label={texts.breadcrumbLabel}
          className="flex flex-wrap items-center gap-2 py-5 font-mono text-xs uppercase tracking-[0.04em] text-muted"
        >
          {breadcrumb.map((item, index) => (
            <Fragment key={`${index}-${item.label}`}>
              {index > 0 && (
                <span aria-hidden className="opacity-50">
                  /
                </span>
              )}
              {item.href ? (
                <Link href={item.href} className="hover:text-horizon">
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink">{item.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      </div>

      {!detail ? (
        <p className="py-16 text-center text-base text-ink">{texts.unavailable}</p>
      ) : (
        <section className="pb-16 pt-2">
          <div
            className={`${CONTAINER} grid grid-cols-[330px_1fr_380px] items-start gap-11 max-[1100px]:grid-cols-[280px_1fr_340px] max-[1100px]:gap-[30px] max-[900px]:grid-cols-1 max-[900px]:gap-8`}
          >
            <div className="max-[900px]:order-3">
              <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon">{detail.category.name}</span>
              <h1 className="mt-2 font-display text-[clamp(24px,2.1vw,30px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]">
                {detail.name}
              </h1>
              <div className="mt-4 h-0.5 w-16 bg-ink opacity-90" />

              {detail.video && (
                <div className="relative mt-12 aspect-video overflow-hidden rounded-[9px] bg-[#0A1519] max-[900px]:mt-6">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    title={detail.name}
                    className="absolute inset-0 h-full w-full bg-[#0A1519] object-cover"
                  >
                    <source src={detail.video.src} type={detail.video.type} />
                  </video>
                </div>
              )}

              <SurfboardDescription markdown={detail.descriptionMarkdown} />

              {detail.attributes && (
                <div className="mt-12 border-t border-border pt-9">
                  <span className="mb-[26px] block font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon">
                    {texts.attributes}
                  </span>
                  {detail.attributes.map((section) => (
                    <section key={section.title} className="border-b border-border py-11 first-of-type:pt-0 last:border-b-0">
                      <h3 className="mb-7 font-display text-[clamp(26px,3.2vw,34px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink">
                        {section.title}
                      </h3>
                      <div className="flex flex-col gap-9">
                        {section.items.map((item) => (
                          <div key={item.label} data-testid={`scale-${item.label}`}>
                            <span className="font-mono text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink">{item.label}</span>
                            <div
                              role="meter"
                              aria-label={item.label}
                              aria-valuenow={item.value}
                              aria-valuemin={SCALE_MIN}
                              aria-valuemax={SCALE_MAX}
                              className="relative mb-2.5 mt-4 h-[9px] rounded-[5px] bg-border"
                            >
                              <div
                                data-part="fill"
                                className="absolute left-0 top-0 h-full rounded-[5px] bg-horizon"
                                style={{ width: `${item.value}%` }}
                              />
                              <div
                                data-part="marker"
                                className="absolute top-1/2 h-[19px] w-[19px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-horizon shadow-[0_0_0_1.5px_#155EEF,0_2px_5px_rgba(18,33,42,.22)]"
                                style={{ left: `${item.value}%` }}
                              />
                            </div>
                            <div className="relative h-7 font-mono text-[10.5px] uppercase leading-[1.3] tracking-[0.03em] text-muted">
                              {scalePositions(item.scale.length).map((position, index) => (
                                <span
                                  key={position}
                                  data-position={position}
                                  className={`absolute top-0 w-1/3 ${SCALE_LABEL_POSITION[position]}`}
                                >
                                  {item.scale[index]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <SurfboardGallery images={detail.images} name={detail.name} />

            <SurfboardBuyPanel price={detail.price} sizes={detail.sizes} defaultSizeIndex={detail.defaultSizeIndex} />
          </div>
        </section>
      )}
    </main>
  );
}
