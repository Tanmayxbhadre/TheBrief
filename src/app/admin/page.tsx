import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatRelativeTime } from '@/lib/utils';
import {
  Newspaper,
  Eye,
  FileEdit,
  Globe,
  Radio,
  Clock,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    newStoriesCount,
    reviewCount,
    draftsCount,
    publishedCount,
    publishedTodayCount,
    totalSourcesCount,
    errorSourcesCount,
    recentStories,
    recentActivity,
  ] = await Promise.all([
    prisma.newsItem.count({ where: { status: 'DISCOVERED' } }),
    prisma.newsItem.count({ where: { status: 'REVIEW' } }),
    prisma.articleDraft.count({
      where: { status: { in: ['DRAFT', 'REVIEW', 'APPROVED'] } },
    }),
    prisma.articleDraft.count({ where: { status: 'PUBLISHED' } }),
    prisma.articleDraft.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: startOfToday },
      },
    }),
    prisma.source.count(),
    prisma.source.count({ where: { lastError: { not: null }, enabled: true } }),
    prisma.newsItem.findMany({
      where: { status: { in: ['DISCOVERED', 'REVIEW'] } },
      include: { source: true, category: true },
      orderBy: { discoveredAt: 'desc' },
      take: 6,
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Editorial Newsroom</h1>
        <p className={styles.subtitle}>
          Real-time oversight of collected wire stories, editorial drafts, and published journalism.
        </p>
      </div>

      {/* Real Statistics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>New Stories</span>
            <Newspaper size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{newStoriesCount}</span>
          <span className={styles.statSub}>Awaiting triage</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Under Review</span>
            <Eye size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{reviewCount}</span>
          <span className={styles.statSub}>Assigned to editors</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Active Drafts</span>
            <FileEdit size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{draftsCount}</span>
          <span className={styles.statSub}>In editorial pipeline</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Published</span>
            <Globe size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{publishedCount}</span>
          <span className={styles.statSub}>{publishedTodayCount} published today</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Active Sources</span>
            <Radio size={18} className={styles.statIcon} />
          </div>
          <span className={styles.statValue}>{totalSourcesCount}</span>
          <span className={styles.statSub}>
            {errorSourcesCount > 0 ? (
              <span style={{ color: '#c0392b' }}>{errorSourcesCount} with errors</span>
            ) : (
              'All channels healthy'
            )}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: Recent Stories Queue */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Newspaper size={16} />
              <span>Incoming News Queue</span>
            </h2>
            <Link href="/admin/news" className={styles.panelLink}>
              View All Queue →
            </Link>
          </div>

          <div className={styles.list}>
            {recentStories.length === 0 ? (
              <div className={styles.emptyState}>
                No pending news stories. Click &quot;Fetch News Now&quot; above to collect fresh stories.
              </div>
            ) : (
              recentStories.map((story) => (
                <div key={story.id} className={styles.storyItem}>
                  {story.imageUrl ? (
                    <img
                      src={story.imageUrl}
                      alt=""
                      className={styles.storyThumb}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={styles.storyThumb}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '0.65rem',
                      }}
                    >
                      No Image
                    </div>
                  )}

                  <div className={styles.storyContent}>
                    <div className={styles.storyMeta}>
                      <span className={styles.categoryTag}>
                        {story.category?.name || 'General'}
                      </span>
                      <span>·</span>
                      <span>{story.source.name}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(story.discoveredAt.toISOString())}</span>
                    </div>

                    <h3 className={styles.storyHeadline}>
                      <Link href={`/admin/news/${story.id}`}>{story.title}</Link>
                    </h3>

                    <div className={styles.storyActions}>
                      <Link
                        href={`/admin/news/${story.id}`}
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      >
                        Inspect Story
                      </Link>
                      <a
                        href={story.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        Source ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Quick Actions</h2>
            </div>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link
                href="/admin/drafts"
                className={styles.actionBtn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.8rem',
                }}
              >
                <PlusCircle size={15} color="var(--color-accent)" />
                <span>Create New Article Draft</span>
              </Link>
              <Link
                href="/admin/news?status=review"
                className={styles.actionBtn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.8rem',
                }}
              >
                <Eye size={15} color="var(--color-accent)" />
                <span>Review Pending Queue ({reviewCount})</span>
              </Link>
              <Link
                href="/admin/sources"
                className={styles.actionBtn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.8rem',
                }}
              >
                <Radio size={15} color="var(--color-accent)" />
                <span>Check Source Feed Health</span>
              </Link>
            </div>
          </div>

          {/* Activity Log */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Clock size={16} />
                <span>Newsroom Activity</span>
              </h2>
            </div>

            <div className={styles.list}>
              {recentActivity.length === 0 ? (
                <div className={styles.emptyState}>No activity logged yet.</div>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className={styles.activityItem}>
                    <div className={styles.activityUserTime}>
                      <span>{act.user}</span>
                      <span>{formatRelativeTime(act.createdAt.toISOString())}</span>
                    </div>
                    <div className={styles.activityDetails}>
                      {act.details || act.action}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
