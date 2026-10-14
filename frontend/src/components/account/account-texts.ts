/** My Account page strings (design `my-account.html`). */
export const texts = {
  home: 'Home',
  pageTitle: 'My Account',
  /** Google sign-ups have no name, so the greeting drops it rather than printing ", ." */
  welcome: (firstName: string, lastName: string) => {
    const name = [firstName, lastName].filter(Boolean).join(' ');
    return name ? `Welcome back, ${name}.` : 'Welcome back.';
  },

  signOut: 'Sign Out',
  signingOut: 'Signing out…',

  tabsLabel: 'Account sections',
  overviewTab: 'My Account',
  detailsTab: 'Account Details',

  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  save: 'Save Changes',
  saving: 'Saving…',
  saved: 'Profile updated.',
  // Design gap: the design has no error copy for the profile form.
  saveFailed: "Couldn't save your changes. Please try again.",

  wishlist: 'Wishlist',
  savedCount: (count: number) => `${count} saved`,
  wishlistEmptyStart: 'Your wishlist is empty. Browse ',
  surfboards: 'Surfboards',
  or: ' or ',
  apparel: 'Apparel',
  wishlistEmptyEnd: ' to add favorites.',

  orderHistory: 'Order History',
  // Design gap: the design has no Order History empty state.
  ordersEmpty: "You haven't placed any orders yet.",

  copyright: '© 2026 WESTLINE. Find Your Line.',
};
