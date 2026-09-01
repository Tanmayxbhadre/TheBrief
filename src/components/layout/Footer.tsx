'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

const CATEGORIES = [
  { label: 'India', href: '/india' },
  { label: 'World', href: '/world' },
  { label: 'Technology', href: '/technology' },
  { label: 'AI', href: '/ai' },
  { label: 'Business', href: '/business' },
  { label: 'Startups', href: '/startups' },
  { label: 'Science', href: '/science' },
  { label: 'Gaming', href: '/gaming' },
];

const COMPANY = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Editorial Policy', href: '/editorial-policy' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

export default function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.inner}`}>

        {/* Top: Brand + Links */}
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>THE BRIEF</Link>
            <p className={styles.tagline}>
              Serious journalism for the modern reader. Clear, concise, and trustworthy.
            </p>
          </div>

          <div className={styles.linkGroup}>
            <h3 className={styles.groupLabel}>News</h3>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={styles.footerLink}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkGroup}>
            <h3 className={styles.groupLabel}>Company</h3>
            <ul>
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={styles.footerLink}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.linkGroup}>
            <h3 className={styles.groupLabel}>Follow</h3>
            <ul>
              <li><a href="https://twitter.com/thebrief" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>X (Twitter)</a></li>
              <li><a href="https://instagram.com/thebrief" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Instagram</a></li>
              <li><a href="https://linkedin.com/company/thebrief" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>LinkedIn</a></li>
              <li><Link href="/rss.xml" className={styles.footerLink}>RSS Feed</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} THE BRIEF. All rights reserved.
          </p>
          <p className={styles.disclaimer}>
            Content is for informational purposes. We are not responsible for external links.
          </p>
        </div>

      </div>
    </footer>
  );
}
