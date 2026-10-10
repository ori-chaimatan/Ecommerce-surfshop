'use client';

import { useId, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';

type AccordionId = 'description' | 'shipping';

const SHIPPING_BODY = (
  <ul>
    {texts.standard.shippingLines.map((line) => (
      <li key={line}>{line}</li>
    ))}
  </ul>
);

interface StandardAccordionsProps {
  markdown: string;
}

export function StandardAccordions({ markdown }: StandardAccordionsProps) {
  // One open at a time, Description first (design); clicking the open one closes it.
  const [openId, setOpenId] = useState<AccordionId | null>('description');
  const baseId = useId();
  const groups: { id: AccordionId; title: string; body: ReactNode }[] = [
    { id: 'description', title: texts.standard.description, body: <ReactMarkdown>{markdown}</ReactMarkdown> },
    { id: 'shipping', title: texts.standard.shippingReturns, body: SHIPPING_BODY },
  ];

  return (
    <div className="mt-8">
      {groups.map((group) => {
        const open = openId === group.id;
        const headerId = `${baseId}-${group.id}-header`;
        const panelId = `${baseId}-${group.id}-panel`;
        return (
          <div key={group.id} className="border-b border-border">
            <button
              id={headerId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : group.id)}
              className="flex w-full items-center justify-between py-5 text-left text-[15px] font-bold text-ink"
            >
              {group.title}
              <Icon
                name="chevron-down"
                className={`h-4 w-4 shrink-0 fill-none stroke-muted stroke-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!open}
              className="pb-[22px] text-[14.5px] leading-[1.7] text-muted [&_li]:mb-1.5 [&_li]:list-disc [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_strong]:text-ink [&_ul]:pl-[18px]"
            >
              {group.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
