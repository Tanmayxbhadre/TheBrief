/**
 * Notifies all open browser tabs (including homepage) that new news has been published.
 */
export function notifyNewsPublished() {
  if (typeof window === 'undefined') return;

  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('thebrief_news_channel');
      channel.postMessage({ type: 'NEWS_PUBLISHED', timestamp: Date.now() });
      channel.close();
    }
  } catch {}

  try {
    localStorage.setItem('thebrief_last_published', Date.now().toString());
  } catch {}
}
