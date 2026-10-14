import { NextResponse, type NextRequest } from 'next/server';
import { validateProfile } from '@/lib/account/validate-profile';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { NO_STORE } from '@/lib/cart/route-helpers';
import { updateMe } from '@/lib/strapi/account';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * Saves the signed-in shopper's name and email. Validates the body like the form did and
 * forwards only those fields to Strapi, which re-validates and writes the caller's own user.
 */
export async function PATCH(request: NextRequest) {
  const jwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return json({ error: { code: 'unauthorized' } }, 401);

  const validated = validateProfile(await request.json().catch(() => null));
  if (!validated.ok) return json({ error: { code: 'bad-request', fields: validated.fields } }, 400);

  const result = await updateMe(jwt, validated.value);
  if (result.ok) return json({ profile: result.profile }, 200);
  if (result.reason === 'invalid') return json({ error: { code: 'bad-request', fields: result.fields } }, 400);
  if (result.reason === 'unauthorized') return json({ error: { code: 'unauthorized' } }, 401);
  return json({ error: { code: 'failed' } }, 502);
}
