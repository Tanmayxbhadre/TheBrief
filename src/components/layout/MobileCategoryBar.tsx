'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileCategoryBar.module.css';

const CATEGORIES = [
  { label: 'All', href: '/' },
  { label: 'Latest', href: '/daily-news' },
  { label: 'India', href: '/india' },
  { label: 'World', href: '/world' },
  { label: 'Technology', href: '/technology' },
  { label: 'AI', href: '/ai' },
  { label: 'Business', href: '/business' },
  { label: 'Finance', href: '/finance' },
  { label: 'Science', href: '/science' },
  { label: 'Startups', href: '/startups' },
  { label: 'Sports', href: '/sports' },
];

export default function MobileCategoryBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className={styles.container} role="navigation" aria-label="Category quick navigation">
      <div className={styles.fadeLeft} aria-hidden="true" />
      <div className={styles.scrollRail}>
        {CATEGORIES.map((cat) => {
          const active = isActive(cat.href);
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
      <div className={styles.fadeRight} aria-hidden="true" />
    </div>
  );
}
