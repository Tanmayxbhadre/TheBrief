'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Search,
  ExternalLink,
  FileEdit,
  Archive,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import styles from './DraftsList.module.css';

interface PublishedArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  category: { id: string; name: string; slug: string } | null;
}

interface PublishedArticlesListProps {
  initialCategories: { id: string; name: string; slug: string }[];
}

export function PublishedArticlesList({ initialCategories }: PublishedArticlesListProps) {
  const [articles, setArticles] = useState<PublishedArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('PUBLISHED');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionItem, setActionItem] = useState<{
    id: string;
    title: string;
    action: 'archive' | 'unpublish';
  } | null>(null);

  const fetchArticles = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      params.set('status', status);

      const res = await fetch(`/api/admin/drafts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setArticles(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to load published articles:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  const handleExecuteAction = async () => {
    if (!actionItem) return;

    try {
      const res = await fetch(`/api/admin/articles/${actionItem.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionItem.action }),
      });

      if (res.ok) {
        setFeedback(
          actionItem.action === 'unpublish'
            ? 'Article unpublished and moved back to Drafts.'
            : 'Article archived.'
        );
        setActionItem(null);
        fetchArticles();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedback('Failed to execute action.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Published Articles & Archive</h1>
          <p className={styles.subtitle}>
            Live journalism currently visible to public readers and search engines.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e8edf8',
            color: 'var(--color-accent, #1a3a8b)',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '4px',
          }}
        >
          {feedback}
        </div>
      )}

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search published stories..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="PUBLISHED">Published (Live)</option>
          <option value="ARCHIVED">Archived</option>
          <option value="all">All (Published & Archived)</option>
        </select>

        <select
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {initialCategories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Live Headline & Route</th>
              <th className={styles.th} style={{ width: '130px' }}>Category</th>
              <th className={styles.th} style={{ width: '150px' }}>Byline</th>
              <th className={styles.th} style={{ width: '130px' }}>Published</th>
              <th className={styles.th} style={{ width: '100px' }}>Status</th>
              <th className={styles.th} style={{ width: '220px', textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Loading published articles from database...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No articles found in this view.
                </td>
              </tr>
            ) : (
              articles.map((item) => {
                const liveUrl = `/${item.category?.slug || 'news'}/${item.slug}`;

                return (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div>
                        <Link
                          href={`/admin/drafts/${item.id}`}
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#171717',
                          }}
                        >
                          {item.title}
                        </Link>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#777',
                            marginTop: '2px',
                          }}
                        >
                          <code>{liveUrl}</code>
                        </p>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-accent, #1a3a8b)',
                        }}
                      >
                        {item.category?.name || 'General'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.8rem', color: '#444' }}>
                        {item.authorName}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.75rem', color: '#777' }}>
                        {item.publishedAt ? formatDate(item.publishedAt) : 'Draft'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${
                          item.status === 'PUBLISHED'
                            ? styles.badgePUBLISHED
                            : styles.badgeARCHIVED
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div className={styles.actionsCell}>
                        {item.status === 'PUBLISHED' && (
                          <a
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                            title="View public live article"
                          >
                            <ExternalLink size={13} style={{ display: 'inline', marginRight: '3px' }} />
                            View Live
                          </a>
                        )}

                        <Link
                          href={`/admin/drafts/${item.id}`}
                          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          title="Edit article"
                        >
                          <FileEdit size={13} />
                        </Link>

                        {item.status === 'PUBLISHED' ? (
                          <button
                            onClick={() =>
                              setActionItem({
                                id: item.id,
                                title: item.title,
                                action: 'archive',
                              })
                            }
                            className={styles.actionBtn}
                            title="Archive article"
                          >
                            <Archive size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setActionItem({
                                id: item.id,
                                title: item.title,
                                action: 'unpublish',
                              })
                            }
                            className={styles.actionBtn}
                            title="Move back to draft"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {actionItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setActionItem(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '6px',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#171717' }}>
              {actionItem.action === 'archive' ? 'Archive Published Article?' : 'Unpublish Article?'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              {actionItem.action === 'archive'
                ? `Are you sure you want to archive "${actionItem.title}"? Archived articles will be removed from public homepage feeds and category feeds.`
                : `Are you sure you want to unpublish "${actionItem.title}"? It will be moved back to editable draft status.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className={styles.actionBtn}
                onClick={() => setActionItem(null)}
              >
                Cancel
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={handleExecuteAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
