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
    approvedNewsCount,
    draftsCount,
    publishedCount,
    publishedTodayCount,
    totalSourcesCount,
    errorSourcesCount,
    pendingDrafts,
    recentStories,
    recentActivity,
  ] = await Promise.all([
    prisma.newsItem.count({ where: { status: 'DISCOVERED' } }),
    prisma.newsItem.count({ where: { status: 'REVIEW' } }),
    prisma.newsItem.count({ where: { status: 'APPROVED' } }),
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
    prisma.articleDraft.findMany({
      where: { status: { in: ['DRAFT', 'REVIEW'] } },
      include: {
        category: true,
        cluster: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
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
          <span className={styles.statSub}>
            {approvedNewsCount > 0 ? (
              <Link href="/admin/news?status=approved" style={{ color: 'var(--color-accent)' }}>
                {approvedNewsCount} approved →
              </Link>
            ) : (
              'Assigned to editors'
            )}
          </span>
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

      {/* AI Drafts / Needs Review Section */}
      <div className={styles.panel} style={{ border: '1px solid #fed7aa', backgroundColor: '#fffbeb' }}>
        <div className={styles.panelHeader} style={{ backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <h2 className={styles.panelTitle} style={{ color: '#9a3412', fontWeight: 700 }}>
              AI DRAFTS / NEEDS REVIEW ({draftsCount})
            </h2>
          </div>
          <Link href="/admin/drafts" className={styles.panelLink} style={{ color: '#c2410c', fontWeight: 600 }}>
            View All Drafts →
          </Link>
        </div>

        <div className={styles.list}>
          {pendingDrafts.length === 0 ? (
            <div className={styles.emptyState} style={{ color: '#7c2d12' }}>
              No pending drafts awaiting review. High-confidence safe stories auto-publish automatically.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', padding: '1rem' }}>
              {pendingDrafts.map((draft) => {
                let reason = 'Requires editorial verification';
                let sourceCount = draft.cluster?.items.length || 1;
                try {
                  if (draft.internalNotes) {
                    const parsed = JSON.parse(draft.internalNotes);
                    reason = parsed.decisionReason || (parsed.notes && parsed.notes[0]) || reason;
                    if (parsed.sourceCount) sourceCount = parsed.sourceCount;
                  }
                } catch {
                  if (draft.internalNotes) reason = draft.internalNotes;
                }

                return (
                  <div
                    key={draft.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                          {draft.category?.name || 'General'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#78716c' }}>
                          {formatRelativeTime(draft.createdAt.toISOString())}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1c1917', lineHeight: 1.35, marginBottom: '0.75rem' }}>
                        {draft.title}
                      </h3>

                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: 6 }}>
                        <span>Confidence: <strong>{draft.publishConfidence ?? 85}%</strong></span>
                        <span>Quality: <strong>{draft.aiQualityScore ?? 90}%</strong></span>
                        <span>Sources: <strong>{sourceCount}</strong></span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fffbeb', padding: '0.4rem 0.6rem', borderRadius: 6, marginBottom: '1rem', borderLeft: '3px solid #f59e0b' }}>
                        <strong>Reason:</strong> {reason}
                      </div>
                    </div>

                    <Link
                      href={`/admin/drafts/${draft.id}`}
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      style={{ textAlign: 'center', display: 'block', padding: '0.5rem' }}
                    >
                      Review Draft →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
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
