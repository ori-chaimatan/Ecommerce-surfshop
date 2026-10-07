import { describe, expect, it } from 'vitest';
import { buildBreadcrumb } from '@/components/product-detail/shared/breadcrumb';

const product = {
  name: 'Samurai Pro 22" Boardshort',
  category: { name: 'Clothing', href: '/products/category/clothing' },
};

describe('buildBreadcrumb (AC5)', () => {
  it('is Home / Category / Product, with every item but the last linked', () => {
    expect(buildBreadcrumb(product)).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Clothing', href: '/products/category/clothing' },
      { label: 'Samurai Pro 22" Boardshort' },
    ]);
  });

  it('adds the gender level between the category and the product when there is one', () => {
    expect(buildBreadcrumb({ ...product, gender: { label: 'Men', href: '/products/category/clothing?gender=men' } })).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Clothing', href: '/products/category/clothing' },
      { label: 'Men', href: '/products/category/clothing?gender=men' },
      { label: 'Samurai Pro 22" Boardshort' },
    ]);
  });

  it('is just Home when the product could not be loaded (AC4)', () => {
    expect(buildBreadcrumb(null)).toEqual([{ label: 'Home' }]);
  });
});
