import styles from './QuickSummary.module.css';

interface QuickSummaryProps {
  points: string[];
}

export default function QuickSummary({ points }: QuickSummaryProps) {
  if (!points.length) return null;

  return (
    <aside className={styles.box} aria-label="Quick summary">
      <h2 className={styles.heading}>Quick Summary</h2>
      <ul className={styles.list}>
        {points.map((point, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.bullet} aria-hidden="true">—</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
