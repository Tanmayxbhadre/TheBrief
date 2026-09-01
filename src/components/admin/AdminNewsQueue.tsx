'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  FilePlus,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import styles from './AdminNewsQueue.module.css';

interface NewsItemWithRelations {
  id: string;
  title: string;
  description: string | null;
  originalUrl: string;
  author: string | null;
  publishedAt: string | null;
  discoveredAt: string;
  imageUrl: string | null;
  status: string;
  source: { id: string; name: string };
  category: { id: string; name: string; slug: string } | null;
  drafts?: { id: string; title: string; status: string; slug: string }[];
}

interface AdminNewsQueueProps {
  initialCategories: { id: string; name: string; slug: string }[];
  initialSources: { id: string; name: string }[];
}

export function AdminNewsQueue({ initialCategories, initialSources }: AdminNewsQueueProps) {
  const router = useRouter();

  const [items, setItems] = useState<NewsItemWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sourceId, setSourceId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sort, setSort] = useState('newest_discovered');

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    action: 'review' | 'approve' | 'reject' | 'archive';
    label: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      if (sourceId !== 'all') params.set('sourceId', sourceId);
      if (dateFilter !== 'all') params.set('date', dateFilter);
      if (sort) params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '25');

      const res = await fetch(`/api/admin/news?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setItems(data.items || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load news items:', err);
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sourceId, dateFilter, sort, page]);

  // Debounced fetch on search / filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateDraft = async (newsItemId: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemId }),
      });

      const data = await res.json();
      if (res.ok && data.draft?.id) {
        router.push(`/admin/drafts/${data.draft.id}`);
      } else {
        showFeedback(data.error || 'Could not create draft');
        setProcessing(false);
      }
    } catch {
      showFeedback('Failed to create draft');
      setProcessing(false);
    }
  };

  const handleBulkActionExecute = async () => {
    if (!confirmAction || selectedIds.length === 0) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: confirmAction.action,
          ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback(`Successfully updated ${data.count} stories.`);
        setSelectedIds([]);
        setConfirmAction(null);
        fetchItems();
      } else {
        showFeedback(data.error || 'Bulk action failed');
      }
    } catch {
      showFeedback('Bulk action failed');
    } finally {
      setProcessing(false);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>News Queue</h1>
          <p className={styles.subtitle}>
            Triage, review, reject, and promote automated wire stories into editorial drafts.
          </p>
        </div>

        {feedback && (
          <div
            style={{
              padding: '0.4rem 0.8rem',
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
      </div>

      {/* Filter and Search Controls */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search headline, source, or category..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className={styles.select}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Status: All</option>
            <option value="discovered">Discovered (New)</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
            <option value="draft">Draft Created</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className={styles.select}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Category: All</option>
            {initialCategories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Source: All</option>
            {initialSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Date: All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
          </select>

          <select
            className={styles.select}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest_discovered">Sort: Discovered (Newest)</option>
            <option value="oldest_discovered">Sort: Discovered (Oldest)</option>
            <option value="newest_published">Sort: Published (Newest)</option>
            <option value="oldest_published">Sort: Published (Oldest)</option>
          </select>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className={styles.bulkToolbar}>
            <span>{selectedIds.length} stories selected</span>
            <div className={styles.bulkActions}>
              <button
                className={styles.bulkBtn}
                onClick={() =>
                  setConfirmAction({
                    action: 'review',
                    label: `Move ${selectedIds.length} items to Review`,
                  })
                }
              >
                Mark as Review
              </button>
              <button
                className={styles.bulkBtn}
                onClick={() =>
                  setConfirmAction({
                    action: 'approve',
                    label: `Approve ${selectedIds.length} items`,
                  })
                }
              >
                Approve
              </button>
              <button
                className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
                onClick={() =>
                  setConfirmAction({
                    action: 'reject',
                    label: `Reject ${selectedIds.length} stories`,
                  })
                }
              >
                Reject Stories
              </button>
              <button
                className={styles.bulkBtn}
                onClick={() =>
                  setConfirmAction({
                    action: 'archive',
                    label: `Archive ${selectedIds.length} items`,
                  })
                }
              >
                Archive
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / List */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: '36px' }}>
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={handleSelectAll}
                  aria-label="Select all stories"
                />
              </th>
              <th className={styles.th}>Story / Headline</th>
              <th className={styles.th} style={{ width: '120px' }}>Category</th>
              <th className={styles.th} style={{ width: '130px' }}>Source</th>
              <th className={styles.th} style={{ width: '110px' }}>Discovered</th>
              <th className={styles.th} style={{ width: '100px' }}>Status</th>
              <th className={styles.th} style={{ width: '180px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Loading stories from newsroom database...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No news stories found matching the current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const hasDraft = item.drafts && item.drafts.length > 0;
                const draft = hasDraft ? item.drafts![0] : null;

                return (
                  <tr key={item.id} className={styles.tr}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className={styles.storyHeadlineCell}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className={styles.thumbnail} />
                        ) : (
                          <div
                            className={styles.thumbnail}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              color: '#999',
                            }}
                          >
                            Wire
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/news/${item.id}`}
                            className={styles.headlineText}
                          >
                            {item.title}
                          </Link>
                          {item.description && (
                            <p
                              style={{
                                fontSize: '0.725rem',
                                color: 'var(--color-text-secondary, #666666)',
                                marginTop: '2px',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
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
                      <span style={{ fontSize: '0.775rem', color: '#444' }}>
                        {item.source.name}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.725rem', color: '#777' }}>
                        {formatRelativeTime(item.discoveredAt)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[`badge${item.status}`] || styles.badgeDISCOVERED
                        }`}
                      >
                        {item.status === 'DISCOVERED' ? 'NEW' : item.status}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/news/${item.id}`}
                          className={styles.actionIconBtn}
                          title="Inspect story details"
                        >
                          <Eye size={13} style={{ display: 'inline', marginRight: '3px' }} />
                          Inspect
                        </Link>

                        {hasDraft ? (
                          <Link
                            href={`/admin/drafts/${draft!.id}`}
                            className={`${styles.actionIconBtn} ${styles.actionDraftBtn}`}
                            title="Edit attached draft"
                          >
                            Edit Draft
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleCreateDraft(item.id)}
                            disabled={processing}
                            className={`${styles.actionIconBtn} ${styles.actionDraftBtn}`}
                            title="Create Article Draft"
                          >
                            <FilePlus size={13} style={{ display: 'inline', marginRight: '3px' }} />
                            Create Draft
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

        {/* Pagination bar */}
        <div className={styles.pagination}>
          <span>
            Showing {items.length} of {total} stories (Page {page} of {totalPages})
          </span>
          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Actions */}
      {confirmAction && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmAction(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className={styles.modalTitle}>Confirm Action</h3>
            <p className={styles.modalBody}>
              Are you sure you want to {confirmAction.label.toLowerCase()}?
              {confirmAction.action === 'reject' && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#c0392b' }}>
                  Rejected stories will be moved out of the active review queue.
                </span>
              )}
            </p>
            <div className={styles.modalFooter}>
              <button
                className={styles.bulkBtn}
                onClick={() => setConfirmAction(null)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className={`${styles.bulkBtn} ${
                  confirmAction.action === 'reject' ? styles.bulkBtnDanger : ''
                }`}
                onClick={handleBulkActionExecute}
                disabled={processing}
                style={{
                  backgroundColor:
                    confirmAction.action === 'reject' ? '#c0392b' : 'var(--color-accent, #1a3a8b)',
                  color: '#ffffff',
                }}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
