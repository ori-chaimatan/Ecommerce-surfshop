'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthField } from '../_components/auth-field';
import { GoogleButton } from '../_components/google-button';
import { AuthHeader } from '../_components/auth-header';
import { PrimaryButton } from '../_components/primary-button';
import { OrDivider } from '../_components/or-divider';
import { FormError } from '../_components/form-error';
import { handleSubmit as submitAuthForm } from '../utils';
import { texts } from './login-texts';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    await submitAuthForm({
      event,
      url: '/api/auth/login',
      body: { email, password },
      setError,
      setSubmitting,
      onSuccess: () => {
        router.push('/');
        router.refresh();
      },
    });
  }

  return (
    <div>
      <AuthHeader heading={texts.heading} subtitle={texts.subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField label={texts.emailLabel} id="loginEmail" type="email" value={email} onChange={setEmail} placeholder={texts.emailPlaceholder} />
        <div>
          <AuthField
            label={texts.passwordLabel}
            id="loginPassword"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={texts.passwordPlaceholder}
          />
          <div className="mt-2.5 flex justify-end">
            <Link href="/forgot-password" className="text-xs text-horizon underline underline-offset-4 hover:text-horizon-deep">
              {texts.forgotPasswordLink}
            </Link>
          </div>
        </div>

        {error && <FormError>{error}</FormError>}

        <PrimaryButton disabled={submitting}>{submitting ? texts.submitLoading : texts.submitIdle}</PrimaryButton>
      </form>

      <OrDivider />
      <GoogleButton />
      <p className="mt-5 text-center text-sm text-muted">
        {texts.newToWestlinePrefix}{' '}
        <Link href="/signup" className="font-bold text-horizon hover:underline">
          {texts.createAccountLink}
        </Link>
      </p>
    </div>
  );
}
