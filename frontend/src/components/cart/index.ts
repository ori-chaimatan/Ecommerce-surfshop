// Server-safe barrel: the layout and SiteNav import from here. Client components use
// `./cart-context` directly (it calls createContext, so it can't be in a server graph).
export { CartProvider } from './CartProvider';
export { CartNavButton } from './CartNavButton';
