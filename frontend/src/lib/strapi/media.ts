import { STRAPI_URL } from './client';

/** Strapi returns uploads as `/uploads/…`; make them absolute so next/image can fetch them. */
export function strapiMediaUrl(url: string) {
  return url.startsWith('/') ? `${STRAPI_URL}${url}` : url;
}
