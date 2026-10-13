import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { Icon } from '@/shared/components/icons';
import { getSession } from '@/lib/auth/session';
import { CART_HREF, HOME_HREF, LOGIN_HREF, WISHLIST_HREF } from '@/lib/routes';
import { getNavigation } from '@/lib/strapi/navigation';
import { DesktopMenu } from './DesktopMenu';
import { MobileMenu } from './MobileMenu';
import { buildNavMenu } from './nav-menu';
import { styles } from './site-nav.styles';
import { texts } from './site-nav-texts';

export const SiteNav = async (): Promise<React.JSX.Element> => {
  const session = getSession();
  const { categories, subcategoryGenders } = await getNavigation();
  const items = buildNavMenu(categories, subcategoryGenders);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href={HOME_HREF} className={styles.wordmark}>
          {texts.wordmark}
        </Link>

        <DesktopMenu items={items} />

        <div className={styles.actions}>
          {session ? (
            <LogoutButton />
          ) : (
            <Link
              href={LOGIN_HREF}
              aria-label={texts.accountLabel}
              className={styles.signIn}
            >
              <Icon name="account" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
              <span className={styles.signInLabel}>{texts.signIn}</span>
            </Link>
          )}
          <Link href={WISHLIST_HREF} aria-label={texts.wishlistLabel} className={styles.iconLink}>
            <Icon name="heart" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
          </Link>
          <Link href={CART_HREF} aria-label={texts.cartLabel} className={styles.iconLink}>
            <Icon name="cart" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
          </Link>
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
};
