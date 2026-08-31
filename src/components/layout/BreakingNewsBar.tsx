import Link from 'next/link';
import styles from './BreakingNewsBar.module.css';
import { BreakingNewsItem } from '@/lib/types';

interface BreakingNewsBarProps {
  item: BreakingNewsItem;
}

export default function BreakingNewsBar({ item }: BreakingNewsBarProps) {
  return (
    <div className={styles.bar} role="complementary" aria-label="Breaking news">
      <div className={`container ${styles.inner}`}>
        <div className={styles.liveTag} aria-label="Live news">
          <span className={styles.liveDot} aria-hidden="true" />
          <span>Live</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <Link href={item.url} className={styles.headline}>
          {item.headline}
        </Link>
        <Link href={item.url} className={styles.readLink} aria-label={`Read more: ${item.headline}`}>
          Read →
        </Link>
      </div>
    </div>
  );
}
