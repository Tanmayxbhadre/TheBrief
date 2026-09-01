'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileEdit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import styles from './DraftsList.module.css';

interface DraftItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  status: string;
  readingTime: number;
  updatedAt: string;
  publishedAt: string | null;
  category: { id: string; name: string; slug: string } | null;
  newsItem?: { id: string; source: { name: string } } | null;
}

interface DraftsListProps {
  initialCategories: { id: string; name: string; slug: string }[];
}

export function DraftsList({ initialCategories }: DraftsListProps) {
  const router = useRouter();

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);

  const fetchDrafts = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);

      const res = await fetch(`/api/admin/drafts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrafts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDrafts]);

  const handleCreateBlankDraft = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Article Draft' }),
      });

      const data = await res.json();
      if (res.ok && data.draft?.id) {
        router.push(`/admin/drafts/${data.draft.id}`);
      } else {
        setFeedback(data.error || 'Failed to create draft');
        setCreating(false);
      }
    } catch {
      setFeedback('Failed to create draft');
      setCreating(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/drafts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setDeleteDraftId(null);
        setFeedback('Draft deleted.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to delete draft');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Editorial Drafts</h1>
          <p className={styles.subtitle}>
            Articles currently in progress, under review, or queued for publishing.
          </p>
        </div>

        <button
          onClick={handleCreateBlankDraft}
          disabled={creating}
          className={styles.newBtn}
        >
          <Plus size={15} />
          <span>{creating ? 'Creating...' : 'New Blank Draft'}</span>
        </button>
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
            placeholder="Search drafts by title, excerpt, author..."
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
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
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

      {/* Drafts Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Article Draft</th>
              <th className={styles.th} style={{ width: '130px' }}>Category</th>
              <th className={styles.th} style={{ width: '150px' }}>Author</th>
              <th className={styles.th} style={{ width: '120px' }}>Updated</th>
              <th className={styles.th} style={{ width: '100px' }}>Status</th>
              <th className={styles.th} style={{ width: '140px', textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Loading drafts from editorial database...
                </td>
              </tr>
            ) : drafts.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No drafts found. Click &quot;New Blank Draft&quot; or promote a story from the News Queue.
                </td>
              </tr>
            ) : (
              drafts.map((draft) => (
                <tr key={draft.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div>
                      <Link
                        href={`/admin/drafts/${draft.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: '#171717',
                        }}
                      >
                        {draft.title}
                      </Link>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#777',
                          marginTop: '2px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        /{draft.category?.slug || 'news'}/{draft.slug}
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
                      {draft.category?.name || 'General'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontSize: '0.8rem', color: '#444' }}>
                      {draft.authorName}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontSize: '0.75rem', color: '#777' }}>
                      {formatRelativeTime(draft.updatedAt)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`badge${draft.status}`] || styles.badgeDRAFT
                      }`}
                    >
                      {draft.status}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div className={styles.actionsCell}>
                      <Link
                        href={`/admin/drafts/${draft.id}`}
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      >
                        <FileEdit size={13} style={{ display: 'inline', marginRight: '3px' }} />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteDraftId(draft.id)}
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        title="Delete draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDraftId && (
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
          onClick={() => setDeleteDraftId(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '6px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#171717' }}>
              Delete Article Draft?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>
              This will permanently delete this draft. The original source NewsItem record will remain intact in the news queue.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className={styles.actionBtn}
                onClick={() => setDeleteDraftId(null)}
              >
                Cancel
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                style={{ backgroundColor: '#c0392b', color: '#fff' }}
                onClick={() => handleDeleteDraft(deleteDraftId)}
              >
                Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
