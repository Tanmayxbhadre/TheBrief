'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { Menu, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './AdminLayout.module.css';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user?: string;
  counts?: {
    discovered?: number;
    drafts?: number;
  };
}

export function AdminLayoutClient({ children, user = 'Editor', counts }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Newsroom Overview';
    if (pathname.startsWith('/admin/news/')) return 'Story Inspector';
    if (pathname === '/admin/news') return 'Live News Queue';
    if (pathname.startsWith('/admin/drafts/')) return 'Article Editor';
    if (pathname === '/admin/drafts') return 'Editorial Drafts';
    if (pathname === '/admin/articles') return 'Published Archive';
    if (pathname === '/admin/sources') return 'Sources & Health';
    if (pathname === '/admin/categories') return 'Category Directory';
    if (pathname === '/admin/settings') return 'System Settings';
    return 'Newsroom';
  };

  const handleFetchNews = async () => {
    if (collecting) return;
    setCollecting(true);
    setCollectionStatus('Collecting news from RSS feeds...');

    try {
      const res = await fetch('/api/admin/news/collect', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        const { newItems, duplicates, sourcesProcessed } = data.data;
        setCollectionStatus(
          `Complete! ${newItems} new stories found, ${duplicates} duplicates from ${sourcesProcessed} sources.`
        );
        setTimeout(() => {
          setCollectionStatus(null);
          window.location.reload();
        }, 2500);
      } else {
        setCollectionStatus(`Error: ${data.error || 'Failed to collect news'}`);
        setTimeout(() => setCollectionStatus(null), 4000);
      }
    } catch {
      setCollectionStatus('Error: Failed to connect to news collector.');
      setTimeout(() => setCollectionStatus(null), 4000);
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className={styles.container}>
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        counts={counts}
      />

      {sidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className={styles.breadcrumb}>
              <span>Newsroom</span>
              <span>/</span>
              <span className={styles.breadcrumbCurrent}>{getPageTitle()}</span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {collectionStatus && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: collectionStatus.startsWith('Error')
                    ? '#c0392b'
                    : 'var(--color-accent, #1a3a8b)',
                }}
              >
                {collectionStatus.startsWith('Error') ? (
                  <AlertCircle size={13} />
                ) : (
                  <CheckCircle size={13} />
                )}
                {collectionStatus}
              </span>
            )}

            <button
              onClick={handleFetchNews}
              disabled={collecting}
              className={styles.fetchNewsBtn}
              title="Trigger RSS collection pipeline now"
            >
              <RefreshCw size={13} className={collecting ? 'spin-icon' : ''} />
              <span>{collecting ? 'Fetching...' : 'Fetch News Now'}</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
