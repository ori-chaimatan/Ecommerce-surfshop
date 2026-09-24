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
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password';
import { handleSubmit as submitAuthForm } from '../utils';
import { texts } from './signup-texts';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    await submitAuthForm({
      event,
      url: '/api/auth/register',
      body: { firstName, lastName, email, password },
      validate: () => (password.length < MIN_PASSWORD_LENGTH ? PASSWORD_TOO_SHORT_MESSAGE : null),
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
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5">
          <AuthField label={texts.firstNameLabel} id="signupFirst" value={firstName} onChange={setFirstName} placeholder={texts.firstNamePlaceholder} />
          <AuthField label={texts.lastNameLabel} id="signupLast" value={lastName} onChange={setLastName} placeholder={texts.lastNamePlaceholder} />
        </div>
        <AuthField label={texts.emailLabel} id="signupEmail" type="email" value={email} onChange={setEmail} placeholder={texts.emailPlaceholder} />
        <div>
          <AuthField
            label={texts.passwordLabel}
            id="signupPassword"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={texts.passwordPlaceholder}
          />
          <p className="mt-2 text-xs text-muted">{PASSWORD_HINT}</p>
        </div>

        {error && <FormError>{error}</FormError>}

        <PrimaryButton disabled={submitting}>{submitting ? texts.submitLoading : texts.submitIdle}</PrimaryButton>
      </form>

      <OrDivider />
      <GoogleButton />
      <p className="mt-5 text-center text-sm text-muted">
        {texts.alreadyHaveAccountPrefix}{' '}
        <Link href="/login" className="font-bold text-horizon hover:underline">
          {texts.signInLink}
        </Link>
      </p>
    </div>
  );
}
