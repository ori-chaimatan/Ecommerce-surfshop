'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PROFILE_FIELDS, validateProfile, type Profile, type ProfileErrors, type ProfileField } from '@/lib/account/validate-profile';
import { ACCOUNT_HREF, ACCOUNT_PROFILE_API_HREF, loginHref } from '@/lib/routes';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** How long "Profile updated." stays (the design's 2.5s). */
const SAVED_NOTE_MS = 2500;

/**
 * The Account Details form's state: values, inline errors, and the save round trip to
 * `/api/account/profile`. Invalid fields focus the first one; a 401 goes to sign-in.
 */
export function useSaveProfile(account: Profile, onSaved: (profile: Profile) => void) {
  const router = useRouter();
  const [values, setValues] = useState<Profile>(account);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [status, setStatus] = useState<SaveStatus>('idle');
  const fieldRefs = useRef<Partial<Record<ProfileField, HTMLInputElement | null>>>({});
  const noteTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const focusFirstError = (fields: ProfileErrors) => {
    const first = PROFILE_FIELDS.find((field) => fields[field]);
    if (first) fieldRefs.current[first]?.focus();
  };

  const showErrors = (fields: ProfileErrors) => {
    setErrors(fields);
    setStatus('idle');
    focusFirstError(fields);
  };

  const setField = (field: ProfileField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === 'saving') return;

    const validated = validateProfile(values);
    if (!validated.ok) return showErrors(validated.fields);

    window.clearTimeout(noteTimer.current);
    setErrors({});
    setStatus('saving');

    const response = await fetch(ACCOUNT_PROFILE_API_HREF, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated.value),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      profile?: Profile;
      error?: { fields?: ProfileErrors };
    } | null;

    if (response?.ok && body?.profile) {
      setValues(body.profile);
      setStatus('saved');
      onSaved(body.profile);
      router.refresh();
      noteTimer.current = window.setTimeout(() => setStatus('idle'), SAVED_NOTE_MS);
    } else if (response?.status === 401) {
      router.push(loginHref(ACCOUNT_HREF));
    } else if (response?.status === 400 && body?.error?.fields) {
      showErrors(body.error.fields);
    } else {
      setStatus('error');
    }
  };

  return { values, errors, status, fieldRefs, setField, submit };
}
