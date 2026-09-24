'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AuthField } from '../_components/auth-field';
import { AuthHeader } from '../_components/auth-header';
import { PrimaryButton, PrimaryLinkButton } from '../_components/primary-button';
import { OrDivider } from '../_components/or-divider';
import { FormError } from '../_components/form-error';
import { SuccessIcon } from '../_components/success-icon';
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password';
import { handleSubmit as submitAuthForm } from '../utils';
import { texts } from './reset-password-texts';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function renderInvalidLink() {
    return (
      <div className="text-center">
        <AuthHeader heading={texts.invalidHeading} subtitle={texts.invalidMessage} />
        <PrimaryLinkButton href="/forgot-password">{texts.requestNewLinkButton}</PrimaryLinkButton>
      </div>
    );
  }

  function renderSuccess() {
    return (
      <div className="text-center">
        <SuccessIcon />
        <h1 className="font-display mb-2.5 text-3xl font-extrabold uppercase leading-none text-ink">{texts.successHeading}</h1>
        <p className="mb-7 text-sm text-muted">{texts.successMessage}</p>
        <PrimaryLinkButton href="/">{texts.continueButton}</PrimaryLinkButton>
      </div>
    );
  }

  if (!code) return renderInvalidLink();

  if (success) return renderSuccess();

  async function handleSubmit(event: FormEvent) {
    await submitAuthForm({
      event,
      url: '/api/auth/reset-password',
      body: { password, passwordConfirmation: confirmPassword, code },
      validate: () => {
        if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_TOO_SHORT_MESSAGE;
        if (password !== confirmPassword) return texts.passwordMismatchError;
        return null;
      },
      setError,
      setSubmitting,
      onSuccess: () => {
        setSuccess(true);
        router.refresh();
      },
    });
  }

  return (
    <div>
      <AuthHeader heading={texts.heading} subtitle={texts.subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          label={texts.newPasswordLabel}
          id="newPassword"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={texts.passwordPlaceholder}
        />
        <div>
          <AuthField
            label={texts.confirmPasswordLabel}
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={texts.passwordPlaceholder}
          />
          <p className="mt-2 text-xs text-muted">{PASSWORD_HINT}</p>
        </div>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
