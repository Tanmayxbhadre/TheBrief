'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';
import styles from './Header.module.css';

const NAV_LINKS = [
  { label: 'Latest', href: '/daily-news' },
  { label: 'India', href: '/india' },
  { label: 'World', href: '/world' },
  { label: 'Technology', href: '/technology' },
  { label: 'AI', href: '/ai' },
  { label: 'Business', href: '/business' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} role="banner">
        <div className={`container ${styles.inner}`}>

          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="THE BRIEF — Home">
            <span className={styles.logoText}>THE BRIEF</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav} aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className={styles.actions}>
            <Link href="/search" className={styles.iconBtn} aria-label="Search">
              <Search size={18} strokeWidth={1.75} />
            </Link>
            <button
              className={styles.iconBtn}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>

        </div>
      </header>

      <MobileMenu
        id="mobile-menu"
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
