'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LiveNewsRefresherProps {
  initialLatestPublishedAt: string | null;
  initialLatestArticleId: string | null;
  intervalMs?: number;
}

/**
 * High-Performance Client-Side Live News Refresher
 * Listens for cross-tab publication broadcasts, monitors visibility changes,
 * and polls the lightweight /api/news/version endpoint to seamlessly update the homepage.
 */
export default function LiveNewsRefresher({
  initialLatestPublishedAt,
  initialLatestArticleId,
  intervalMs = 15000,
}: LiveNewsRefresherProps) {
  const router = useRouter();
  const lastKnownRef = useRef<{
    publishedAt: string | null;
    articleId: string | null;
  }>({
    publishedAt: initialLatestPublishedAt,
    articleId: initialLatestArticleId,
  });

  useEffect(() => {
    lastKnownRef.current = {
      publishedAt: initialLatestPublishedAt,
      articleId: initialLatestArticleId,
    };
  }, [initialLatestPublishedAt, initialLatestArticleId]);

  useEffect(() => {
    let isMounted = true;

    const refreshNews = () => {
      if (!isMounted) return;
      router.refresh();
    };

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
        if (!isMounted || !data) return;

        const serverPublishedAt = data.latestPublishedAt;
        const serverArticleId = data.latestArticleId;

        const currentPublishedAt = lastKnownRef.current.publishedAt;
        const currentArticleId = lastKnownRef.current.articleId;

        const hasNewArticle =
          (serverArticleId && serverArticleId !== currentArticleId) ||
          (serverPublishedAt && serverPublishedAt !== currentPublishedAt);

        if (hasNewArticle) {
          lastKnownRef.current = {
            publishedAt: serverPublishedAt,
            articleId: serverArticleId,
          };
          refreshNews();
        }
      } catch {
        // Silently ignore network check errors
      }
    };

    // 1. Cross-tab Broadcast Channel for instantaneous updates
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('thebrief_news_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEWS_PUBLISHED') {
            checkNewsVersion();
            refreshNews();
          }
        };
      }
    } catch {}

    // 2. Storage event listener fallback for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'thebrief_last_published') {
        checkNewsVersion();
        refreshNews();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Recurring periodic poll
    const interval = setInterval(checkNewsVersion, intervalMs);

    // 4. Smart refresh on tab focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewsVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', checkNewsVersion);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkNewsVersion);
    };
  }, [router, intervalMs]);

  return null;
}
