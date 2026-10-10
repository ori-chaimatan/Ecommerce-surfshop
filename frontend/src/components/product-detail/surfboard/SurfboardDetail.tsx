import { texts } from '../product-detail-texts';
import { SCALE_MAX, SCALE_MIN } from './surfboard-detail';
import { styles } from './surfboard-detail.styles';
import type { ISurfboardDetailProps } from './surfboard.types';
import { SurfboardBuyPanel } from './SurfboardBuyPanel';
import { SurfboardDescription } from './SurfboardDescription';
import { SurfboardGallery } from './SurfboardGallery';

type ScalePosition = keyof typeof styles.scaleTick.position;

const scalePositions = (count: number): ScalePosition[] => (count === 3 ? ['start', 'middle', 'end'] : ['start', 'end']);

export const SurfboardDetail = ({ detail }: ISurfboardDetailProps): React.JSX.Element => {
  return (
    <section className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.info}>
          <span className={styles.eyebrow}>{detail.category.name}</span>
          <h1 className={styles.title}>
            {detail.name}
          </h1>
          <div className={styles.rule} />

          {detail.video && (
            <div className={styles.videoFrame}>
              <video controls playsInline preload="metadata" title={detail.name} className={styles.video}>
                <source src={detail.video.src} type={detail.video.type} />
              </video>
            </div>
          )}

          <SurfboardDescription markdown={detail.descriptionMarkdown} />

          {detail.attributes && (
            <div className={styles.attributes}>
              <span className={styles.attributesLabel}>{texts.attributes}</span>
              {detail.attributes.map((section) => (
                <section key={section.title} className={styles.attributeSection}>
                  <h3 className={styles.attributeTitle}>
                    {section.title}
                  </h3>
                  <div className={styles.scales}>
                    {section.items.map((item) => (
                      <div key={item.label}>
                        <span className={styles.scaleLabel}>{item.label}</span>
                        <div
                          role="meter"
                          aria-label={item.label}
                          aria-valuenow={item.value}
                          aria-valuemin={SCALE_MIN}
                          aria-valuemax={SCALE_MAX}
                          className={styles.meter}
                        >
                          <div data-part="fill" className={styles.meterFill} style={{ width: `${item.value}%` }} />
                          <div
                            data-part="marker"
                            className={styles.meterMarker}
                            style={{ left: `${item.value}%` }}
                          />
                        </div>
                        <div className={styles.scaleTicks}>
                          {scalePositions(item.scale.length).map((position, index) => (
                            <span
                              key={position}
                              data-position={position}
                              className={`${styles.scaleTick.base} ${styles.scaleTick.position[position]}`}
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

        <SurfboardBuyPanel documentId={detail.documentId} price={detail.price} sizes={detail.sizes} defaultSizeIndex={detail.defaultSizeIndex} />
      </div>
    </section>
  );
};
