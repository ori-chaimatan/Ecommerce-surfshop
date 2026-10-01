export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#F9F9F9] px-4 py-6">
      <div className="w-full max-w-[440px] px-6 py-9 sm:px-11">{children}</div>
    </main>
  );
}
