// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFooter, isSafeHref } from '@/lib/strapi/footer';

const mockFetch = vi.fn();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const FOOTER = {
  Tagline: 'Find Your Line.',
  Columns: [
    { id: 1, Title: 'Shop', Links: [{ id: 2, Label: 'Surfboards', Url: '/products/category/surfboards' }] },
    { id: 3, Title: 'Help', Links: [{ id: 4, Label: 'Blog', Url: 'https://blog.example.com/' }] },
  ],
  LegalLinks: [{ id: 5, Label: 'Privacy', Url: '/privacy' }],
  Copyright: '© 2026 WESTLINE. Find Your Line.',
};

describe('getFooter (site-footer AC1, AC4, AC5)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the footer with its columns, links and legal links, cached for 60s', async () => {
    mockFetch.mockResolvedValueOnce(json({ data: FOOTER }));

    await expect(getFooter()).resolves.toEqual({
      tagline: 'Find Your Line.',
      columns: [
        { title: 'Shop', links: [{ label: 'Surfboards', href: '/products/category/surfboards', external: false }] },
        { title: 'Help', links: [{ label: 'Blog', href: 'https://blog.example.com/', external: true }] },
      ],
      legalLinks: [{ label: 'Privacy', href: '/privacy', external: false }],
      copyright: '© 2026 WESTLINE. Find Your Line.',
    });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit & { next?: { revalidate?: number } }];
    expect(decodeURIComponent(url)).toMatch(/\/api\/footer\?populate\[Columns\]\[populate\]=Links&populate\[LegalLinks\]=true$/);
    expect(init.next?.revalidate).toBe(60);
  });

  it('drops unsafe or empty links, and columns left without links (AC4)', async () => {
    mockFetch.mockResolvedValueOnce(
      json({
        data: {
          ...FOOTER,
          Columns: [
            { Title: 'Shop', Links: [{ Label: 'Evil', Url: 'javascript:alert(1)' }, { Label: 'Ok', Url: '/ok' }] },
            { Title: 'Empty', Links: [{ Label: 'Proto-relative', Url: '//evil.example' }] },
            { Title: '', Links: [{ Label: 'No title', Url: '/x' }] },
            { Title: 'NoLabel', Links: [{ Label: ' ', Url: '/x' }] },
          ],
          LegalLinks: [{ Label: 'Data', Url: 'data:text/html,hi' }],
        },
      })
    );

    const footer = await getFooter();
    expect(footer?.columns).toEqual([{ title: 'Shop', links: [{ label: 'Ok', href: '/ok', external: false }] }]);
    expect(footer?.legalLinks).toEqual([]);
  });

  it('tolerates missing optional fields', async () => {
    mockFetch.mockResolvedValueOnce(json({ data: { Columns: null } }));
    await expect(getFooter()).resolves.toEqual({ tagline: '', columns: [], legalLinks: [], copyright: '' });
  });

  it('returns null when there is no footer document, Strapi errors, or the body is malformed (AC5)', async () => {
    mockFetch.mockResolvedValueOnce(json({ data: null, error: { status: 404 } }, 404));
    await expect(getFooter()).resolves.toBeNull();
    expect(console.error).not.toHaveBeenCalled();
    mockFetch.mockResolvedValueOnce(json({}, 500));
    await expect(getFooter()).resolves.toBeNull();
    mockFetch.mockRejectedValueOnce(new Error('down'));
    await expect(getFooter()).resolves.toBeNull();
    mockFetch.mockResolvedValueOnce(json({ data: 'nope' }));
    await expect(getFooter()).resolves.toBeNull();
  });
});

describe('isSafeHref', () => {
  it.each(['/products', '/account#wishlist', 'https://x.example', 'http://x.example/a'])('accepts %s', (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each(['//evil.example', 'javascript:alert(1)', 'mailto:a@b.co', 'products', '', ' /x'])('rejects %j', (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});
