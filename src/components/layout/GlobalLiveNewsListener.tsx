'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import styles from './GlobalLiveNewsListener.module.css';

interface NewStoryNotification {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  isBreaking: boolean;
}

export default function GlobalLiveNewsListener() {
  const router = useRouter();
  const pathname = usePathname();
  const [notification, setNotification] = useState<NewStoryNotification | null>(null);
  const lastKnownIdRef = useRef<string | null>(null);
  const isInitialCheckRef = useRef<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Fast check for new stories
    const checkNewsVersion = async () => {
      if (!navigator.onLine || document.visibilityState === 'hidden') {
        return;
      }

      try {
        const res = await fetch('/api/news/version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data || !data.latestArticleId) return;

        // On first run, record initial state without showing toast
        if (isInitialCheckRef.current) {
          isInitialCheckRef.current = false;
          lastKnownIdRef.current = data.latestArticleId;
          return;
        }

        // Check if article is newer than last known
        if (data.latestArticleId !== lastKnownIdRef.current) {
          lastKnownIdRef.current = data.latestArticleId;

          // Always refresh server components if on home or category
          if (pathname === '/' || pathname?.startsWith('/technology') || pathname?.startsWith('/india') || pathname?.startsWith('/world')) {
            router.refresh();
          }

          // Show rich toast notification
          if (data.latestTitle && data.latestSlug) {
            setNotification({
              id: data.latestArticleId,
              title: data.latestTitle,
              slug: data.latestSlug,
              categorySlug: data.categorySlug || 'news',
              isBreaking: !!data.isBreaking,
            });
          }
        }
      } catch {
        // Silently catch background network error
      }
    };

    // 1. Cross-tab Broadcast Channel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('thebrief_news_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEWS_PUBLISHED') {
            checkNewsVersion();
          }
        };
      }
    } catch {}

    // 2. Storage event listener fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'thebrief_last_published') {
        checkNewsVersion();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Periodic lightweight polling every 15 seconds
    const interval = setInterval(checkNewsVersion, 15000);

    // 4. Tab visibility change & online events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewsVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkNewsVersion);

    // Initial trigger
    checkNewsVersion();

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkNewsVersion);
    };
  }, [router, pathname]);

  if (!notification) return null;

  const articleUrl = `/${notification.categorySlug}/${notification.slug}`;

  return (
    <aside
      className={styles.toastContainer}
      aria-label="New news notification"
      role="alert"
    >
      <div
        className={`${styles.toast} ${
          notification.isBreaking ? styles.toastBreaking : styles.toastStandard
        }`}
      >
        <div className={styles.toastContent}>
          <div className={styles.badgeRow}>
            {notification.isBreaking && <span className={styles.liveDot} />}
            <span
              className={`${styles.badgeText} ${
                !notification.isBreaking ? styles.badgeTextAccent : ''
              }`}
            >
              {notification.isBreaking ? 'Breaking Story' : 'Just Published'}
            </span>
          </div>

          <p className={styles.toastTitle}>{notification.title}</p>

          <div className={styles.actionRow}>
            <Link
              href={articleUrl}
              className={styles.readButton}
              onClick={() => setNotification(null)}
            >
              <span>Read article</span>
              <ArrowRight size={13} />
            </Link>

            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => {
                router.refresh();
                setNotification(null);
              }}
            >
              Update feed
            </button>
          </div>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setNotification(null)}
          aria-label="Dismiss new news alert"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
