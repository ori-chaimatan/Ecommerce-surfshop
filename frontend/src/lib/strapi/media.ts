const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

/** Strapi returns uploads as `/uploads/…`; make them absolute so next/image can fetch them. */
export function strapiMediaUrl(url: string) {
  return url.startsWith('/') ? `${STRAPI_URL}${url}` : url;
}
