/** Design index.html `section.featured` and `.section-head`. The track itself is the shared ProductSlider. */
export const styles = {
  section: 'bg-surface py-20',
  container: 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4',
  head: 'mb-10 max-w-[640px]',
  eyebrow: 'mb-2.5 block font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon',
  title:
    'm-0 font-display text-[clamp(28px,4.2vw,46px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]',

} as const;
