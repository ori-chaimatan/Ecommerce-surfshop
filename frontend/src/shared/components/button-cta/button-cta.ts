export type ButtonCtaTarget = '_self' | '_blank';

/** What <ButtonCTA> renders — built from a Strapi shared.button-cta by toButtonCta. */
export interface ButtonCtaData {
  text: string;
  href: string;
  target: ButtonCtaTarget;
}

/** Strapi shared.button-cta, with its nested shared.target populated (`[populate]=targetLink`). */
export interface StrapiButtonCta {
  Text?: string | null;
  LinkUrl?: string | null;
  targetLink?: { targetLink?: ButtonCtaTarget | null } | null;
}

/** A same-site path (not a protocol-relative `//host` or `/\host`) or an in-page anchor: rendered with next/link. */
export function isInternalHref(href: string) {
  return /^\/(?![\/\\])/.test(href) || href.startsWith('#');
}

/** An internal href or an absolute http(s): / mailto: URL. Anything else (javascript:, data:, //host) is unsafe. */
function isSafeHref(href: string) {
  if (isInternalHref(href)) return true;
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function toButtonCta(button?: StrapiButtonCta | null): ButtonCtaData | null {
  // A button without a link has nothing to render, and an unsafe link (javascript:, //host) is dropped.
  if (!button?.Text || !button.LinkUrl || !isSafeHref(button.LinkUrl)) {
    return null;
  }

  return {
    text: button.Text,
    href: button.LinkUrl,
    target: button.targetLink?.targetLink === '_blank' ? '_blank' : '_self',
  };
}
