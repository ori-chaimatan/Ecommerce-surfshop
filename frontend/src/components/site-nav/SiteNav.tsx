import Link from 'next/link';
import { CartNavButton } from '@/components/cart';
import { Icon } from '@/shared/components/icons';
import { getSession } from '@/lib/auth/session';
import { HOME_HREF, LOGIN_HREF } from '@/lib/routes';
import { getNavigation } from '@/lib/strapi/navigation';
import { AccountMenu } from './AccountMenu';
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
            <AccountMenu />
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
          <CartNavButton />
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
};
