'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Check, X } from 'lucide-react';
import styles from './DraftsList.module.css';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  enabled: boolean;
  _count?: {
    items: number;
    drafts: number;
    sources: number;
  };
}

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
  }>({ name: '', description: '', seoTitle: '', seoDescription: '' });

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (res.ok && !ignore) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      description: cat.description || '',
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || '',
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...editForm } : c))
        );
        setEditingId(null);
        setFeedback('Category updated successfully.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to update category.');
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, enabled: !currentEnabled } : c))
        );
        setFeedback(`Category ${!currentEnabled ? 'enabled' : 'disabled'}.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to update category state.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Category Architecture</h1>
          <p className={styles.subtitle}>
            Manage editorial beats, taxonomy slugs, and section SEO parameters.
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

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Category Name & Route</th>
              <th className={styles.th}>Description</th>
              <th className={styles.th} style={{ width: '100px' }}>Items Total</th>
              <th className={styles.th} style={{ width: '100px' }}>Drafts Total</th>
              <th className={styles.th} style={{ width: '110px' }}>Status</th>
              <th className={styles.th} style={{ width: '140px', textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <tr key={cat.id} className={styles.tr}>
                    <td className={styles.td}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.searchInput}
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          style={{ padding: '0.3rem 0.5rem' }}
                        />
                      ) : (
                        <div>
                          <span style={{ fontWeight: 600, color: '#171717', fontSize: '0.875rem' }}>
                            {cat.name}
                          </span>
                          <p style={{ fontSize: '0.725rem', color: '#777', marginTop: '2px' }}>
                            <code>/{cat.slug}</code>
                          </p>
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>
                      {isEditing ? (
                        <textarea
                          className={styles.searchInput}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          style={{ padding: '0.3rem 0.5rem', width: '100%', minHeight: '50px' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#555' }}>
                          {cat.description || 'No description configured.'}
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                        {cat._count?.items || 0}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-accent, #1a3a8b)' }}>
                        {cat._count?.drafts || 0}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button
                        onClick={() => handleToggleEnabled(cat.id, cat.enabled)}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: cat.enabled ? '#dcfce7' : '#f3f4f6',
                          color: cat.enabled ? '#166534' : '#666',
                        }}
                      >
                        {cat.enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            title="Save category changes"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className={styles.actionBtn}
                            title="Cancel editing"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className={styles.actionBtn}
                          title="Edit category"
                        >
                          <Edit3 size={13} />
                          <span style={{ marginLeft: '3px' }}>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
