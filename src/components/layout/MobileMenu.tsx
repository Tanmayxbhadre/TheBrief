'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Search } from 'lucide-react';
import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
  currentPath?: string;
}

const ALL_CATEGORIES = [
  { label: 'India', href: '/india' },
  { label: 'World', href: '/world' },
  { label: 'Technology', href: '/technology' },
  { label: 'AI', href: '/ai' },
  { label: 'Business', href: '/business' },
  { label: 'Startups', href: '/startups' },
  { label: 'Science', href: '/science' },
  { label: 'Gaming', href: '/gaming' },
  { label: 'Entertainment', href: '/entertainment' },
];

export default function MobileMenu({ id, isOpen, onClose, links, currentPath }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstFocusable = menuRef.current.querySelector<HTMLElement>('a, button');
      firstFocusable?.focus();
    }
  }, [isOpen]);

  const isActive = (href: string) => {
    if (!currentPath) return false;
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}
      >
        <div className={styles.menuHeader}>
          <span className={styles.menuTitle}>THE BRIEF</span>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close menu">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <Link href="/search" className={styles.searchLink} onClick={onClose}>
            <Search size={16} strokeWidth={1.75} />
            <span>Search news…</span>
          </Link>
        </div>

        <nav aria-label="Mobile navigation">
          <p className={styles.navSection}>Browse</p>
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navItem} ${isActive(link.href) ? styles.navItemActive : ''}`}
                  onClick={onClose}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className={styles.navSection}>All Categories</p>
          <ul className={styles.categoryList}>
            {ALL_CATEGORIES.map((cat) => (
              <li key={cat.href}>
                <Link
                  href={cat.href}
                  className={`${styles.categoryItem} ${isActive(cat.href) ? styles.categoryItemActive : ''}`}
                  onClick={onClose}
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.menuFooter}>
          <Link href="/about" onClick={onClose}>About</Link>
          <Link href="/contact" onClick={onClose}>Contact</Link>
          <Link href="/privacy" onClick={onClose}>Privacy</Link>
        </div>
      </div>
    </>
  );
}
