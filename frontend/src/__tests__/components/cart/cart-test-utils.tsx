import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { EMPTY_CART, type CartLineView, type CartView } from '@/components/cart/cart';
import { CartContext, type CartContextValue } from '@/components/cart/cart-context';

export function makeLine(overrides: Partial<CartLineView> = {}): CartLineView {
  return {
    key: 'p1:M',
    productDocumentId: 'p1',
    sizeKey: 'M',
    name: 'Samurai Pro',
    href: '/products/samurai',
    sizeLabel: 'M',
    unitPrice: '$79',
    lineTotal: '$79',
    quantity: 1,
    maxQty: 5,
    image: { src: 'http://localhost:1337/uploads/s.png', alt: 'Samurai Pro', fit: 'cover' },
    soldOut: false,
    unavailable: false,
    adjusted: false,
    blocked: false,
    ...overrides,
  };
}

export function makeCart(lines: CartLineView[] = [makeLine()], overrides: Partial<CartView> = {}): CartView {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    ...EMPTY_CART,
    lines,
    count,
    subtotal: '$79',
    remainingForFreeShipping: null,
    freeShippingProgress: 1,
    isEmpty: lines.length === 0,
    hasBlockingLines: lines.some((line) => line.blocked),
    ...overrides,
  };
}

export function cartContext(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    cart: makeCart(),
    status: 'ready',
    mutationError: false,
    pendingKeys: new Set(),
    drawerOpen: false,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
    add: vi.fn(async () => 'added' as const),
    setQty: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
    ...overrides,
  };
}

export function renderWithCart(ui: ReactNode, value: CartContextValue = cartContext()) {
  return { value, ...render(<CartContext.Provider value={value}>{ui}</CartContext.Provider>) };
}
