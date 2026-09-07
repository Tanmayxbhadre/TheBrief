'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FileEdit,
  Trash2,
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
  const [status, setStatus] = useState('all_drafts');
  const [filter, setFilter] = useState('all'); // all | needs_review | high_quality | low_confidence | sensitive | breaking | recently_created
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState<{
    action: 'publish' | 'approve' | 'review' | 'delete' | 'archive';
    label: string;
  } | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);

  const fetchDrafts = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      if (filter !== 'all') params.set('filter', filter);

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
  }, [search, category, status, filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrafts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDrafts]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(drafts.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkActionExecute = async () => {
    if (!bulkConfirm || selectedIds.length === 0) return;
    setBulkProcessing(true);

    try {
      const res = await fetch('/api/admin/drafts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkConfirm.action,
          ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const actionLabel = bulkConfirm.action === 'publish' ? 'published' : 'updated';
        setFeedback(`Successfully ${actionLabel} ${data.count} drafts.`);
        setSelectedIds([]);
        setBulkConfirm(null);
        fetchDrafts();
      } else {
        setFeedback(data.error || 'Bulk action failed');
      }
    } catch {
      setFeedback('Bulk action failed');
    } finally {
      setBulkProcessing(false);
    }
  };

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
          <option value="all_drafts">All Drafts (Active)</option>
          <option value="draft">Draft Only</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
          <option value="all">All Statuses (Everything)</option>
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

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkToolbar}>
          <span>{selectedIds.length} drafts selected</span>
          <div className={styles.bulkActions}>
            <button
              className={`${styles.bulkBtn} ${styles.bulkBtnPublish}`}
              onClick={() =>
                setBulkConfirm({
                  action: 'publish',
                  label: `Publish ${selectedIds.length} selected drafts directly to the live website`,
                })
              }
            >
              ⚡ Publish Selected ({selectedIds.length})
            </button>
            <button
              className={styles.bulkBtn}
              onClick={() =>
                setBulkConfirm({
                  action: 'approve',
                  label: `Approve ${selectedIds.length} drafts`,
                })
              }
            >
              Approve
            </button>
            <button
              className={styles.bulkBtn}
              onClick={() =>
                setBulkConfirm({
                  action: 'review',
                  label: `Move ${selectedIds.length} drafts to Review`,
                })
              }
            >
              Mark Review
            </button>
            <button
              className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
              onClick={() =>
                setBulkConfirm({
                  action: 'delete',
                  label: `Permanently delete ${selectedIds.length} drafts`,
                })
              }
            >
              Delete Drafts
            </button>
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {[
          { id: 'all', label: 'All Drafts' },
          { id: 'needs_review', label: '⚠️ Needs Review' },
          { id: 'high_quality', label: '⭐ High Quality (≥90)' },
          { id: 'low_confidence', label: '🔍 Low Confidence (<90)' },
          { id: 'sensitive', label: '🛡️ Sensitive' },
          { id: 'breaking', label: '🚨 Breaking' },
          { id: 'recently_created', label: '⏱️ Recently Created' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: filter === tab.id ? '1px solid #1a3a8b' : '1px solid #e2e8f0',
              backgroundColor: filter === tab.id ? '#1a3a8b' : '#ffffff',
              color: filter === tab.id ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drafts Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: '36px' }}>
                <input
                  type="checkbox"
                  checked={drafts.length > 0 && selectedIds.length === drafts.length}
                  onChange={handleSelectAll}
                  aria-label="Select all drafts"
                />
              </th>
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
                <td colSpan={7} className={styles.emptyState}>
                  Loading drafts from editorial database...
                </td>
              </tr>
            ) : drafts.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No drafts found. Click &quot;New Blank Draft&quot; or promote a story from the News Queue.
                </td>
              </tr>
            ) : (
              drafts.map((draft) => {
                const isSelected = selectedIds.includes(draft.id);

                return (
                  <tr key={draft.id} className={styles.tr}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(draft.id)}
                        aria-label={`Select ${draft.title}`}
                      />
                    </td>
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Confirmation Modal */}
      {bulkConfirm && (
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
          onClick={() => setBulkConfirm(null)}
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
              Confirm Bulk Action
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>
              Are you sure you want to {bulkConfirm.label.toLowerCase()}?
              {bulkConfirm.action === 'publish' && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#166534', fontWeight: 500 }}>
                  This will make all {selectedIds.length} selected articles live on the public site immediately.
                </span>
              )}
              {bulkConfirm.action === 'delete' && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#c0392b', fontWeight: 500 }}>
                  These drafts will be permanently deleted from the database.
                </span>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className={styles.bulkBtn}
                onClick={() => setBulkConfirm(null)}
                disabled={bulkProcessing}
              >
                Cancel
              </button>
              <button
                className={`${styles.bulkBtn} ${
                  bulkConfirm.action === 'delete'
                    ? styles.bulkBtnDanger
                    : bulkConfirm.action === 'publish'
                    ? styles.bulkBtnPublish
                    : ''
                }`}
                onClick={handleBulkActionExecute}
                disabled={bulkProcessing}
                style={{
                  backgroundColor:
                    bulkConfirm.action === 'delete'
                      ? '#c0392b'
                      : bulkConfirm.action === 'publish'
                      ? '#166534'
                      : 'var(--color-accent, #1a3a8b)',
                  color: '#ffffff',
                }}
              >
                {bulkProcessing
                  ? 'Processing...'
                  : bulkConfirm.action === 'publish'
                  ? 'Confirm & Publish'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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
