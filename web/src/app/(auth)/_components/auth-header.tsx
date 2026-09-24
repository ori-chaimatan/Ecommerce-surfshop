import type { ReactNode } from 'react';

export function AuthHeader({ heading, subtitle }: { heading: ReactNode; subtitle: ReactNode }) {
  return (
    <>
      <h1 className="font-display text-3xl font-extrabold uppercase leading-none text-ink">{heading}</h1>
      <p className="mb-7 mt-2 text-sm text-muted">{subtitle}</p>
    </>
  );
}
