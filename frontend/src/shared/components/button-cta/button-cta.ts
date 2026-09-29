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

export function toButtonCta(button?: StrapiButtonCta | null): ButtonCtaData | null {
  // LinkUrl is optional in Strapi; a button without a link has nothing to render.
  if (!button?.Text || !button.LinkUrl) {
    return null;
  }

  return {
    text: button.Text,
    href: button.LinkUrl,
    target: button.targetLink?.targetLink === '_blank' ? '_blank' : '_self',
  };
}
