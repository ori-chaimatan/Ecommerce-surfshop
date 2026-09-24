'use client';

import Link from 'next/link';
import { FormEvent, MouseEvent, useState } from 'react';
import { AuthField } from '../_components/auth-field';
import { AuthHeader } from '../_components/auth-header';
import { PrimaryButton } from '../_components/primary-button';
import { OrDivider } from '../_components/or-divider';
import { FormError } from '../_components/form-error';
import { SuccessIcon } from '../_components/success-icon';
import { handleSubmit as submitAuthForm } from '../utils';
import { texts } from './forgot-password-texts';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    await submitAuthForm({
      event,
      url: '/api/auth/forgot-password',
      body: { email },
      setError,
      setSubmitting,
      onSuccess: () => setConfirmed(true),
    });
  }

  async function handleResend(event: MouseEvent) {
    event.preventDefault();
    if (submitting) return;
    await submitAuthForm({
      event,
      url: '/api/auth/forgot-password',
      body: { email },
      setError,
      setSubmitting,
      onSuccess: () => {
        setResent(true);
        setTimeout(() => setResent(false), 2500);
      },
    });
  }

  function renderCheckEmail() {
    return (
      <div className="text-center">
        <SuccessIcon />
        <h1 className="font-display mb-2.5 text-3xl font-extrabold uppercase leading-none text-ink">{texts.confirmedHeading}</h1>
        <p className="mb-3 text-sm text-muted">
          {texts.confirmedIntroPrefix}<strong>{email || texts.confirmedIntroFallbackEmail}</strong>{texts.confirmedIntroSuffix}
        </p>
        <p className="text-xs text-muted">{texts.confirmedHint}</p>

        <OrDivider />
        <p className="text-sm text-muted">
          {texts.resendPrefix}{' '}
          <a href="#" onClick={handleResend} className="font-bold text-horizon hover:underline">
            {texts.resendLink}
          </a>
        </p>
        <p className="mt-2.5 text-sm text-muted">
          <Link href="/login" className="font-bold text-horizon hover:underline">
            {texts.backToSignInLink}
          </Link>
        </p>
        {resent && <p className="mt-2.5 text-center text-xs text-muted">{texts.resentNotice}</p>}
        {error && (
          <p role="alert" className="mt-2.5 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (confirmed) return renderCheckEmail();

  return (
    <div>
      <AuthHeader heading={texts.heading} subtitle={texts.subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField label={texts.emailLabel} id="forgotEmail" type="email" value={email} onChange={setEmail} placeholder={texts.emailPlaceholder} />

        {error && <FormError>{error}</FormError>}

        <PrimaryButton disabled={submitting}>{submitting ? texts.submitLoading : texts.submitIdle}</PrimaryButton>
      </form>

      <OrDivider />
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-bold text-horizon hover:underline">
          {texts.backToSignInLink}
        </Link>
      </p>
    </div>
  );
}
