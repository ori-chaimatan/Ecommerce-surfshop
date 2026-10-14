import { strapiFetch } from './client';

const FOOTER_QUERY = new URLSearchParams({
  'populate[Columns][populate]': 'Links',
  'populate[LegalLinks]': 'true',
}).toString();

export interface FooterLink {
  label: string;
  href: string;
  /** An http(s) URL (a plain anchor) rather than a storefront path (`next/link`). */
  external: boolean;
}

export interface Footer {
  tagline: string;
  columns: { title: string; links: FooterLink[] }[];
  legalLinks: FooterLink[];
  copyright: string;
}

interface StrapiLink {
  Label?: unknown;
  Url?: unknown;
}

/** Links come from editors: only a same-site path or an http(s) URL is rendered (no `javascript:`, no `//host`). */
export function isSafeHref(href: string): boolean {
  return (href.startsWith('/') && !href.startsWith('//')) || /^https?:\/\//.test(href);
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function toLinks(links: unknown): FooterLink[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((link: StrapiLink) => {
    const label = text(link?.Label);
    const href = text(link?.Url);
    return label && isSafeHref(href) ? [{ label, href, external: !href.startsWith('/') }] : [];
  });
}

/** The site footer from the Strapi `footer` single type, or null when it's missing or Strapi fails. */
export async function getFooter(): Promise<Footer | null> {
  // 404 means the footer hasn't been created yet (run `npm run seed:footer`) — expected, not an error.
  const json = (await strapiFetch(`footer?${FOOTER_QUERY}`, {
    label: 'footer',
    fallback: null,
    silentStatuses: [404],
  })) as { data?: unknown } | null;

  const data = json?.data;
  if (!data || typeof data !== 'object') return null;
  const footer = data as { Tagline?: unknown; Columns?: unknown; LegalLinks?: unknown; Copyright?: unknown };

  const columns = (Array.isArray(footer.Columns) ? footer.Columns : []).flatMap((column: { Title?: unknown; Links?: unknown }) => {
    const title = text(column?.Title);
    const links = toLinks(column?.Links);
    return title && links.length ? [{ title, links }] : [];
  });

  return {
    tagline: text(footer.Tagline),
    columns,
    legalLinks: toLinks(footer.LegalLinks),
    copyright: text(footer.Copyright),
  };
}
