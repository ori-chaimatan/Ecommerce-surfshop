import type { SyntheticEvent } from 'react';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export async function handleSubmit({
  event,
  url,
  body,
  validate,
  setError,
  setSubmitting,
  onSuccess,
}: {
  event: SyntheticEvent;
  url: string;
  body: unknown;
  validate?: () => string | null | undefined;
  setError: (error: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: any) => void;
}) {
  event.preventDefault();
  setError(null);

  if (validate) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
  }

  setSubmitting(true);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error?.message ?? GENERIC_ERROR_MESSAGE);
      return;
    }

    onSuccess(data);
  } catch {
    setError(GENERIC_ERROR_MESSAGE);
  } finally {
    setSubmitting(false);
  }
}
