'use client';

import { useId, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { styles } from './standard-accordions.styles';
import type { IStandardAccordionsProps } from './standard.types';

type AccordionId = 'description' | 'shipping';

const SHIPPING_BODY = (
  <ul>
    {texts.standard.shippingLines.map((line) => (
      <li key={line}>{line}</li>
    ))}
  </ul>
);

export const StandardAccordions = ({ markdown }: IStandardAccordionsProps): React.JSX.Element => {
  // One open at a time, Description first (design); clicking the open one closes it.
  const [openId, setOpenId] = useState<AccordionId | null>('description');
  const baseId = useId();
  const groups: { id: AccordionId; title: string; body: ReactNode }[] = [
    { id: 'description', title: texts.standard.description, body: <ReactMarkdown>{markdown}</ReactMarkdown> },
    { id: 'shipping', title: texts.standard.shippingReturns, body: SHIPPING_BODY },
  ];

  return (
    <div className={styles.accordions}>
      {groups.map((group) => {
        const open = openId === group.id;
        const headerId = `${baseId}-${group.id}-header`;
        const panelId = `${baseId}-${group.id}-panel`;
        return (
          <div key={group.id} className={styles.group}>
            <button
              id={headerId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : group.id)}
              className={styles.header}
            >
              {group.title}
              <Icon name="chevron-down" className={`${styles.chevron.base} ${styles.chevron.state[open ? 'open' : 'closed']}`} />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!open}
              className={styles.panel}
            >
              {group.body}
            </div>
          </div>
        );
      })}
    </div>
  );
};
