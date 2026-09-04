'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LiveNewsRefresherProps {
  initialLatestPublishedAt: string | null;
  initialLatestArticleId: string | null;
  intervalMs?: number;
}

/**
 * Lightweight Client-Side Live News Refresher
 * Periodically checks the lightweight /api/news/version endpoint (every 60 seconds).
 * When new published news is detected or when the tab becomes active after inactivity,
 * triggers Next.js router.refresh() to update the Server Component homepage seamlessly.
 */
export default function LiveNewsRefresher({
  initialLatestPublishedAt,
  initialLatestArticleId,
  intervalMs = 60000,
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

    const checkNewsVersion = async () => {
      // Avoid network traffic if browser is offline or tab is hidden
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

        // Check if a new article was published or the latest article changed
        const hasNewArticle =
          (serverArticleId && serverArticleId !== currentArticleId) ||
          (serverPublishedAt && serverPublishedAt !== currentPublishedAt);

        if (hasNewArticle) {
          lastKnownRef.current = {
            publishedAt: serverPublishedAt,
            articleId: serverArticleId,
          };

          // Seamless server component refresh (preserves scroll position & form states)
          router.refresh();
        }
      } catch {
        // Silently ignore network check errors to prevent console spam
      }
    };

    // 1. Recurring timer (default: every 60s)
    const interval = setInterval(checkNewsVersion, intervalMs);

    // 2. Smart refresh on tab focus / visibility change
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', checkNewsVersion);
    };
  }, [router, intervalMs]);

  // Non-visual component
  return null;
}
