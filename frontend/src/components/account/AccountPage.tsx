'use client';

import { useState } from 'react';
import { ProductBreadcrumb } from '@/components/product-detail/shared/ProductBreadcrumb';
import { CONTAINER } from '@/components/product-detail/shared/layout';
import type { Profile } from '@/lib/account/validate-profile';
import type { StrapiOrder } from '@/lib/strapi/orders';
import type { ProductCard } from '@/shared/components/product-card/product-card';
import { HOME_HREF } from '@/lib/routes';
import { styles } from './account.styles';
import { texts } from './account-texts';
import { AccountDetailsForm } from './AccountDetailsForm';
import { AccountOverview } from './AccountOverview';
import { SignOutButton } from './SignOutButton';
import { useAccountTab, type AccountTab } from './use-account-tab';

interface AccountPageProps {
  account: Profile;
  /** The saved products, newest first, fetched with the page (wishlist spec). */
  wishlist: ProductCard[];
  /** The shopper's orders, newest first, fetched with the page (order-history spec). */
  orders: StrapiOrder[];
}

const BREADCRUMB = [{ label: texts.home, href: HOME_HREF }, { label: texts.pageTitle }];

const TABS: { tab: AccountTab; label: string }[] = [
  { tab: 'overview', label: texts.overviewTab },
  { tab: 'details', label: texts.detailsTab },
];

/** `/account` (design `my-account.html`): hero and hash-routed tabs. The site footer comes from the layout. */
export function AccountPage({ account, wishlist, orders }: AccountPageProps) {
  const { tab, selectTab } = useAccountTab();
  const [name, setName] = useState({ firstName: account.firstName, lastName: account.lastName });

  return (
    <main className={styles.page}>
      <ProductBreadcrumb items={BREADCRUMB} />
      <div className={`${CONTAINER} ${styles.body}`}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.title}>{texts.pageTitle}</h1>
            <p className={styles.lede}>{texts.welcome(name.firstName, name.lastName)}</p>
          </div>
          <SignOutButton />
        </div>

        <div role="tablist" aria-label={texts.tabsLabel} className={styles.tabs}>
          {TABS.map((item) => (
            <button
              key={item.tab}
              type="button"
              role="tab"
              id={`account-tab-${item.tab}`}
              aria-selected={tab === item.tab}
              aria-controls={`account-panel-${item.tab}`}
              className={`${styles.tab.base} ${tab === item.tab ? styles.tab.active : styles.tab.inactive}`}
              onClick={() => selectTab(item.tab)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="account-panel-overview" aria-labelledby="account-tab-overview" hidden={tab !== 'overview'}>
          <AccountOverview wishlist={wishlist} orders={orders} />
        </div>
        <div role="tabpanel" id="account-panel-details" aria-labelledby="account-tab-details" hidden={tab !== 'details'}>
          <AccountDetailsForm
            account={account}
            onSaved={(profile) => setName({ firstName: profile.firstName, lastName: profile.lastName })}
          />
        </div>
      </div>
    </main>
  );
}
