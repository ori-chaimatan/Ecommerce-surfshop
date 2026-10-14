import { texts } from './cart-texts';
import type { IShippingProgressProps } from './cart.types';
import { styles } from './shipping-progress.styles';

export const ShippingProgress = ({ remaining, progress, variant }: IShippingProgressProps): React.JSX.Element => {
  const percent = Math.round(progress * 100);

  return (
    <div className={styles.progress[variant]}>
      <p>{remaining ? texts.remaining(remaining) : texts.unlocked}</p>
      <div
        role="progressbar"
        aria-label={texts.freeShippingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={`${styles.track.height[variant]} ${styles.track.base}`}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
