import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email } = body ?? {};

  try {
    const strapiResponse = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!strapiResponse.ok) {
      const data = await strapiResponse.json().catch(() => null);
      return NextResponse.json(
        { error: { message: data?.error?.message ?? 'Something went wrong. Please try again.' } },
        { status: strapiResponse.status }
      );
    }
  } catch {
    return NextResponse.json({ error: { message: 'Something went wrong. Please try again.' } }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
