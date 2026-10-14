import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECTION_IDS, resolveHash, useAccountTab } from '@/components/account/use-account-tab';

function setHash(hash: string) {
  window.history.replaceState(null, '', hash ? `/account#${hash}` : '/account');
}

describe('resolveHash (account-profile AC5)', () => {
  it.each([
    ['details', { tab: 'details', scroll: null }],
    ['account', { tab: 'details', scroll: null }],
    ['wishlist', { tab: 'overview', scroll: 'wishlist' }],
    ['orders', { tab: 'overview', scroll: 'orders' }],
    ['overview', { tab: 'overview', scroll: null }],
    ['', { tab: 'overview', scroll: null }],
    ['anything-else', { tab: 'overview', scroll: null }],
  ])('#%s', (hash, expected) => {
    expect(resolveHash(hash)).toEqual(expected);
  });
});

describe('useAccountTab (account-profile AC4, AC5)', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
    document.body.innerHTML = `<section id="${SECTION_IDS.wishlist}"></section><section id="${SECTION_IDS.orders}"></section>`;
  });

  afterEach(() => {
    vi.useRealTimers();
    setHash('');
    document.body.innerHTML = '';
  });

  it('opens the overview with no hash', () => {
    setHash('');
    const { result } = renderHook(() => useAccountTab());
    expect(result.current.tab).toBe('overview');
  });

  it('opens Account Details from #details on load', () => {
    setHash('details');
    const { result } = renderHook(() => useAccountTab());
    expect(result.current.tab).toBe('details');
  });

  it('opens the overview and scrolls to the wishlist from #wishlist on load', () => {
    setHash('wishlist');
    const { result } = renderHook(() => useAccountTab());
    expect(result.current.tab).toBe('overview');

    act(() => vi.runAllTimers());
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById(SECTION_IDS.wishlist));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('follows hashchange: #account → details, #orders → overview + scroll to orders', () => {
    setHash('');
    const { result } = renderHook(() => useAccountTab());

    act(() => {
      setHash('account');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.tab).toBe('details');

    act(() => {
      setHash('orders');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.tab).toBe('overview');
    act(() => vi.runAllTimers());
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById(SECTION_IDS.orders));
  });

  it('selecting a tab replaces the hash without adding a history entry', () => {
    setHash('');
    const { result } = renderHook(() => useAccountTab());
    const length = window.history.length;

    act(() => result.current.selectTab('details'));
    expect(result.current.tab).toBe('details');
    expect(window.location.hash).toBe('#details');

    act(() => result.current.selectTab('overview'));
    expect(window.location.hash).toBe('#overview');
    expect(window.history.length).toBe(length);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('stops listening on unmount', () => {
    setHash('');
    const { result, unmount } = renderHook(() => useAccountTab());
    unmount();
    act(() => {
      setHash('details');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.tab).toBe('overview');
  });
});
