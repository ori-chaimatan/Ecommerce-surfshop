// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHomepageHero } from '@/lib/strapi/homepage';

const mockFetch = vi.fn();

function strapiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function hero(overrides: Record<string, unknown> = {}) {
  return {
    Title: 'Westline',
    BackgroundImg: { url: '/uploads/slide_1.jpg', width: 1050, height: 699, alternativeText: '' },
    Button: { Text: 'Shop Now', LinkUrl: '/catalog' },
    ...overrides,
  };
}

describe('getHomepageHero', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches the homepage single type with the Hero image and button populated and 60s revalidation (AC1, AC15)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: { Hero: [] } }));

    await getHomepageHero();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('http://localhost:1337/api/homepage?');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('populate[Hero][populate][BackgroundImg]=true');
    expect(decoded).toContain('populate[Hero][populate][Button][populate]=targetLink');
    expect(init).toEqual(expect.objectContaining({ next: { revalidate: 60 } }));
  });

  it('normalizes heroes in order and makes relative upload URLs absolute (AC1)', async () => {
    mockFetch.mockResolvedValue(
      strapiResponse({
        data: {
          Hero: [
            hero(),
            hero({
              Title: 'Find your Surfboard',
              BackgroundImg: { url: 'https://cdn.example.com/slide_2.jpg', width: 1920, height: 1080 },
              Button: { Text: 'Take the Finder', LinkUrl: '/surfboard-finder' },
            }),
          ],
        },
      })
    );

    await expect(getHomepageHero()).resolves.toEqual([
      {
        headline: 'Westline',
        image: { src: 'http://localhost:1337/uploads/slide_1.jpg', width: 1050, height: 699 },
        cta: { text: 'Shop Now', href: '/catalog', target: '_self' },
      },
      {
        headline: 'Find your Surfboard',
        image: { src: 'https://cdn.example.com/slide_2.jpg', width: 1920, height: 1080 },
        cta: { text: 'Take the Finder', href: '/surfboard-finder', target: '_self' },
      },
    ]);
  });

  it('drops heroes missing an image, title, or button link, keeping the valid ones (AC13)', async () => {
    mockFetch.mockResolvedValue(
      strapiResponse({
        data: {
          Hero: [
            hero({ BackgroundImg: null }),
            hero({ Title: '' }),
            hero({ Button: { Text: 'Shop Now', LinkUrl: null } }),
            hero({ Button: null }),
            hero({ Title: 'Kept' }),
          ],
        },
      })
    );

    const heroes = await getHomepageHero();

    expect(heroes.map((h) => h.headline)).toEqual(['Kept']);
  });

  it("opens a slide's button in a new tab when its Strapi targetLink is _blank (button-cta AC7)", async () => {
    mockFetch.mockResolvedValue(
      strapiResponse({
        data: { Hero: [hero({ Button: { Text: 'Shop Now', LinkUrl: 'https://example.com', targetLink: { targetLink: '_blank' } } })] },
      })
    );

    const [slide] = await getHomepageHero();

    expect(slide.cta).toEqual({ text: 'Shop Now', href: 'https://example.com', target: '_blank' });
  });

  it('returns [] when the homepage document does not exist (404) (AC13)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: null, error: { status: 404 } }, 404));

    await expect(getHomepageHero()).resolves.toEqual([]);
  });

  it('returns [] on a non-2xx response (AC13)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: null, error: { status: 500 } }, 500));

    await expect(getHomepageHero()).resolves.toEqual([]);
  });

  it('returns [] when Strapi is unreachable (AC13)', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));

    await expect(getHomepageHero()).resolves.toEqual([]);
  });

  it('returns [] on malformed data (AC13)', async () => {
    mockFetch.mockResolvedValue(new Response('<html>not json</html>', { status: 200 }));
    await expect(getHomepageHero()).resolves.toEqual([]);

    mockFetch.mockResolvedValue(strapiResponse({ data: { Hero: 'nope' } }));
    await expect(getHomepageHero()).resolves.toEqual([]);
  });
});
