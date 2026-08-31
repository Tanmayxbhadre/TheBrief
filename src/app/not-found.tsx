import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.message}>
          The article or page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeLink}>← Return to homepage</Link>
          <Link href="/search" className={styles.searchLink}>Search articles</Link>
        </div>
      </div>
    </div>
  );
}
