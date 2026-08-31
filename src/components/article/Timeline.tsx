import { TimelineEvent } from '@/lib/types';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (!events.length) return null;

  return (
    <aside className={styles.wrapper} aria-label="Story timeline">
      <h2 className={styles.heading}>Timeline</h2>
      <ol className={styles.list}>
        {events.map((event, i) => (
          <li key={i} className={styles.item}>
            <div className={styles.dateCol}>
              <time className={styles.date}>{event.date}</time>
            </div>
            <div className={styles.contentCol}>
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <p className={styles.eventDesc}>{event.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
