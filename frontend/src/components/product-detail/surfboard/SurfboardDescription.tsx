'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';

interface SurfboardDescriptionProps {
  markdown: string;
}

export function SurfboardDescription({ markdown }: SurfboardDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // The toggle only earns its place when the clamped text actually hides something.
  useEffect(() => {
    const body = bodyRef.current;
    if (body) setOverflows(body.scrollHeight > body.clientHeight + 1);
  }, [markdown]);

  return (
    <div className="mt-5">
      <span className="mb-2.5 block font-mono text-xs font-medium uppercase tracking-[0.14em] text-horizon">
        {texts.fromTheShaper}
      </span>
      <div
        ref={bodyRef}
        className={`text-sm leading-[1.7] text-muted [&_blockquote]:m-0 [&_li]:ml-4 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-ink ${
          expanded ? '' : 'line-clamp-6'
        }`}
      >
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="mt-3 flex items-center gap-1.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.05em] text-horizon"
        >
          <Icon
            name="arrow-right"
            className={`h-[13px] w-[13px] fill-none stroke-horizon stroke-2 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
          {expanded ? texts.readLess : texts.readMore}
        </button>
      )}
    </div>
  );
}
