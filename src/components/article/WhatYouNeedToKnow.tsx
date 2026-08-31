import { WhatYouNeedToKnow as WhatYouNeedToKnowType } from '@/lib/types';
import styles from './WhatYouNeedToKnow.module.css';

interface WhatYouNeedToKnowProps {
  data: WhatYouNeedToKnowType;
}

export default function WhatYouNeedToKnow({ data }: WhatYouNeedToKnowProps) {
  return (
    <aside className={styles.box} aria-label="What you need to know">
      <h2 className={styles.title}>What You Need To Know</h2>

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.question}>What happened?</dt>
          <dd className={styles.answer}>{data.whatHappened}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.question}>Why it matters</dt>
          <dd className={styles.answer}>{data.whyItMatters}</dd>
        </div>
        {data.keyDetails.length > 0 && (
          <div className={styles.row}>
            <dt className={styles.question}>Key details</dt>
            <dd className={styles.answer}>
              <ul className={styles.keyDetails}>
                {data.keyDetails.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        <div className={styles.row}>
          <dt className={styles.question}>What&apos;s next?</dt>
          <dd className={styles.answer}>{data.whatsNext}</dd>
        </div>
      </dl>
    </aside>
  );
}
