import Link from 'next/link';
import type { ReactNode } from 'react';

export function PrimaryButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[9px] bg-horizon px-5 py-4 text-sm font-bold uppercase tracking-wide text-horizon-ink hover:bg-horizon-deep disabled:opacity-75"
    >
      {children}
    </button>
  );
}

export function PrimaryLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-2.5 rounded-[9px] bg-horizon px-5 py-4 text-sm font-bold uppercase tracking-wide text-horizon-ink hover:bg-horizon-deep"
    >
      {children}
    </Link>
  );
}
