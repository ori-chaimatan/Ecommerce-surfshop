import { texts } from './components-texts';

export function GoogleButton() {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  return (
    <a
      href={`${strapiUrl}/api/connect/google`}
      className="flex w-full items-center justify-center gap-2.5 rounded-[9px] border border-border bg-white px-5 py-4 text-sm font-bold uppercase tracking-wide text-ink hover:bg-[#F9F9F9]"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.7A5.4 5.4 0 0 1 3.69 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l3.01-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
      {texts.continueWithGoogle}
    </a>
  );
}
