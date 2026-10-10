import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';

const TRUST_ICON = 'h-[15px] w-[15px] shrink-0 fill-none stroke-horizon stroke-[1.8]';

export function TrustList() {
  return (
    <ul className="mt-[18px] flex flex-col gap-2 border-t border-border pt-[18px]">
      <li className="flex items-center gap-2 text-[13px] text-muted">
        <Icon name="cart" className={TRUST_ICON} />
        {texts.trust.shipping}
      </li>
      <li className="flex items-center gap-2 text-[13px] text-muted">
        <Icon name="return" className={TRUST_ICON} />
        {texts.trust.returns}
      </li>
      <li className="flex items-center gap-2 text-[13px] text-muted">
        <Icon name="clock" className={TRUST_ICON} />
        {texts.trust.dispatch}
      </li>
    </ul>
  );
}
