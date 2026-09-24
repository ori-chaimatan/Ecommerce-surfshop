function Waves() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden sm:h-32">
      <svg
        className="absolute bottom-0 h-full w-[200%] animate-wave-slow text-horizon/10 motion-reduce:animate-none"
        viewBox="0 0 2400 120"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 C1350,120 1550,0 1800,60 C1950,120 2150,0 2400,60 L2400,120 L0,120 Z" />
      </svg>
      <svg
        className="absolute bottom-0 h-full w-[200%] animate-wave text-horizon/20 motion-reduce:animate-none"
        viewBox="0 0 2400 120"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,80 C200,20 400,100 600,60 C800,20 1000,100 1200,80 C1400,20 1600,100 1800,60 C2000,20 2200,100 2400,80 L2400,120 L0,120 Z" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden bg-[#F9F9F9] px-4">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-wide text-ink sm:text-6xl">
          WESTLINE
        </h1>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-horizon">Coming Soon</p>
      </div>

      <Waves />
    </div>
  );
}
