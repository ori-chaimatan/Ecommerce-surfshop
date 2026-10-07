import { texts } from '../product-detail-texts';

export function ProductUnavailable() {
  return <p className="py-16 text-center text-base text-ink">{texts.unavailable}</p>;
}
