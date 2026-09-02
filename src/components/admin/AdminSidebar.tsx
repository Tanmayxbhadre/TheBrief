'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  FileEdit,
  Globe,
  Radio,
  FolderTree,
  Settings,
  LogOut,
  X,
  ExternalLink,
  Activity,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: string;
  counts?: {
    discovered?: number;
    drafts?: number;
  };
}

export function AdminSidebar({ isOpen, onClose, user = 'Editor', counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'News Queue', href: '/admin/news', icon: Newspaper, count: counts?.discovered },
    { label: 'Drafts', href: '/admin/drafts', icon: FileEdit, count: counts?.drafts },
    { label: 'Published', href: '/admin/articles', icon: Globe },
    { label: 'News Collection', href: '/admin/collection', icon: Activity },
    { label: 'Sources & Health', href: '/admin/sources', icon: Radio },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoArea}>
          <span className={styles.logoText}>THE BRIEF</span>
          <span className={styles.subBrand}>Newsroom Desk</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSectionLabel}>Editorial</div>

        {navItems.slice(0, 4).map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className={`${styles.badge} ${active ? styles.badgeActive : ''}`}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}

        <div className={styles.navSectionLabel} style={{ marginTop: '0.75rem' }}>
          System
        </div>

        {navItems.slice(4).map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
            style={{ color: 'var(--color-text-secondary, #666666)' }}
          >
            <ExternalLink size={16} />
            <span>View Public Site</span>
          </a>
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {user.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user}</span>
            <span className={styles.userRole}>Editor-in-Chief</span>
          </div>
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
