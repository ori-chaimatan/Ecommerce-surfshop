import { CONTAINER } from '../shared/layout';

export const styles = {
  section: 'pb-16 pt-2',
  layout: `${CONTAINER} grid grid-cols-[330px_1fr_380px] items-start gap-11 max-[1100px]:grid-cols-[280px_1fr_340px] max-[1100px]:gap-[30px] max-[900px]:grid-cols-1 max-[900px]:gap-8`,
  info: 'max-[900px]:order-3',
  eyebrow: 'font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon',
  title:
    'mt-2 font-display text-[clamp(24px,2.1vw,30px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]',
  rule: 'mt-4 h-0.5 w-16 bg-ink opacity-90',
  videoFrame: 'relative mt-12 aspect-video overflow-hidden rounded-[9px] bg-[#0A1519] max-[900px]:mt-6',
  video: 'absolute inset-0 h-full w-full bg-[#0A1519] object-cover',
  attributes: 'mt-12 border-t border-border pt-9',
  attributesLabel: 'mb-[26px] block font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon',
  attributeSection: 'border-b border-border py-11 first-of-type:pt-0 last:border-b-0',
  attributeTitle:
    'mb-7 font-display text-[clamp(26px,3.2vw,34px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink',
  scales: 'flex flex-col gap-9',
  scaleLabel: 'font-mono text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink',
  meter: 'relative mb-2.5 mt-4 h-[9px] rounded-[5px] bg-border',
  meterFill: 'absolute left-0 top-0 h-full rounded-[5px] bg-horizon',
  meterMarker:
    'absolute top-1/2 h-[19px] w-[19px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-horizon shadow-[0_0_0_1.5px_theme(colors.horizon),0_2px_5px_rgba(18,33,42,.22)]',
  scaleTicks: 'relative h-7 font-mono text-[10.5px] uppercase leading-[1.3] tracking-[0.03em] text-muted',
  // Each label is a third of the track wide, anchored at its true point: start at 0%, middle centred on 50%, end at 100%.
  scaleTick: {
    base: 'absolute top-0 w-1/3',
    position: { start: 'left-0 text-left', middle: 'left-1/2 -translate-x-1/2 text-center', end: 'right-0 text-right' },
  },
} as const;
