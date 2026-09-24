'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthHeader } from '../../../_components/auth-header';
import { PrimaryLinkButton } from '../../../_components/primary-button';
import { texts } from './google-redirect-texts';

function GoogleRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(searchParams.get('error_description') || texts.oauthCancelledError);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const strapiRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/google/callback`, {
          credentials: 'include',
        });
        const data = await strapiRes.json();

        if (!strapiRes.ok) {
          if (!cancelled) setError(data?.error?.message ?? texts.callbackFailedError);
          return;
        }

        const completeRes = await fetch('/api/auth/oauth/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt: data.jwt }),
        });

        if (!completeRes.ok) {
          if (!cancelled) setError(texts.completeFailedError);
          return;
        }

        router.push('/');
        router.refresh();
      } catch {
        if (!cancelled) setError(texts.completeFailedError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  function renderError() {
    return (
      <div className="text-center">
        <AuthHeader heading={texts.failedHeading} subtitle={error} />
        <PrimaryLinkButton href="/login">{texts.backToSignInLink}</PrimaryLinkButton>
      </div>
    );
  }

  if (error) return renderError();

  return <p className="text-center text-sm text-muted">{texts.signingInMessage}</p>;
}

export default function GoogleRedirectPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted">{texts.signingInMessage}</p>}>
      <GoogleRedirectHandler />
    </Suspense>
  );
}
