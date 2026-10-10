import Link from 'next/link';
import { CartNavButton } from '@/components/cart';
import { LogoutButton } from '@/components/logout-button';
import { Icon } from '@/shared/components/icons';
import { getSession } from '@/lib/auth/session';
import { HOME_HREF, LOGIN_HREF, WISHLIST_HREF } from '@/lib/routes';
import { getNavigation } from '@/lib/strapi/navigation';
import { DesktopMenu } from './DesktopMenu';
import { MobileMenu } from './MobileMenu';
import { buildNavMenu } from './nav-menu';
import { texts } from './site-nav-texts';

const ICON_LINK = 'flex p-1.5 text-ink hover:text-horizon';

export async function SiteNav() {
  const session = getSession();
  const { categories, subcategoryGenders } = await getNavigation();
  const items = buildNavMenu(categories, subcategoryGenders);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-white">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-5 px-6">
        <Link href={HOME_HREF} className="font-display text-[22px] font-extrabold uppercase tracking-[0.02em] text-ink">
          {texts.wordmark}
        </Link>

        <DesktopMenu items={items} />

        <div className="flex items-center gap-4">
          {session ? (
            <LogoutButton />
          ) : (
            <Link
              href={LOGIN_HREF}
              aria-label={texts.accountLabel}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-horizon"
            >
              <Icon name="account" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
              <span className="hidden sm:inline">{texts.signIn}</span>
            </Link>
          )}
          <Link href={WISHLIST_HREF} aria-label={texts.wishlistLabel} className={ICON_LINK}>
            <Icon name="heart" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
          </Link>
          <CartNavButton />
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}
