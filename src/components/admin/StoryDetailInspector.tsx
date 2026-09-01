'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  FileEdit,
  XCircle,
  Archive,
  Save,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import styles from './StoryDetailInspector.module.css';

interface StoryDetailInspectorProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    originalUrl: string;
    author: string | null;
    publishedAt: Date | string | null;
    discoveredAt: Date | string;
    imageUrl: string | null;
    imageAlt: string | null;
    status: string;
    internalNotes: string | null;
    checklist: string | null;
    source: {
      id: string;
      name: string;
      url: string;
      type: string;
      country: string | null;
      language: string | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    drafts: {
      id: string;
      title: string;
      status: string;
      slug: string;
    }[];
  };
}

const DEFAULT_CHECKLIST = [
  'Source verified & primary reporting identified',
  'Facts, figures, and quotes checked for accuracy',
  'Headline reviewed for editorial clarity & neutrality',
  'AI-assisted claims verified against source',
  'Featured image inspected & licensed/verified',
  'SEO keywords and meta angle established',
  'Original source attribution links verified',
];

export function StoryDetailInspector({ item }: StoryDetailInspectorProps) {
  const router = useRouter();

  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.internalNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'standard' | 'breaking'>('standard');
  const [editorNotes, setEditorNotes] = useState('');
  const [additionalSources, setAdditionalSources] = useState<
    Array<{ name: string; url: string; description: string }>
  >([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Parse checklist
  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    try {
      return item.checklist ? JSON.parse(item.checklist) : [];
    } catch {
      return [];
    }
  });

  const handleToggleChecklist = async (checkText: string) => {
    const updated = checkedItems.includes(checkText)
      ? checkedItems.filter((i) => i !== checkText)
      : [...checkedItems, checkText];

    setCheckedItems(updated);

    try {
      await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updated }),
      });
    } catch (e) {
      console.error('Failed to auto-save checklist:', e);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      });

      if (res.ok) {
        setFeedback('Internal notes saved.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to save notes.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        setFeedback(`Story status set to ${newStatus}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to update status.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleCreateManualDraft = async () => {
    try {
      const res = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsItemId: item.id }),
      });

      const data = await res.json();
      if (res.ok && data.draft?.id) {
        router.push(`/admin/drafts/${data.draft.id}`);
      } else {
        setFeedback(data.error || 'Failed to create draft');
      }
    } catch {
      setFeedback('Failed to create draft');
    }
  };

  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    setAdditionalSources((prev) => [
      ...prev,
      { name: newSourceName.trim(), url: newSourceUrl.trim(), description: '' },
    ]);
    setNewSourceName('');
    setNewSourceUrl('');
  };

  const handleRemoveSource = (idx: number) => {
    setAdditionalSources((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerateAIDraft = async (overwriteDraftId?: string) => {
    setGeneratingAI(true);
    setAiError(null);

    const steps = [
      'Researching and corroborating sources...',
      'Synthesizing verified facts and implications...',
      'Drafting structured article & quick summary...',
      'Generating SEO metadata and timeline...',
      'Validating output schema and saving draft...',
    ];

    let stepIdx = 0;
    setGenerationStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setGenerationStep(steps[stepIdx]);
      }
    }, 900);

    try {
      const res = await fetch('/api/admin/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsItemId: item.id,
          mode: aiMode,
          additionalSources,
          editorNotes,
          overwriteDraftId,
          forceNewDraft: !overwriteDraftId,
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || 'Failed to generate AI draft');
        setGeneratingAI(false);
        return;
      }

      if (data.draft?.id) {
        router.push(`/admin/drafts/${data.draft.id}`);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setAiError(err instanceof Error ? err.message : 'Network error during generation');
      setGeneratingAI(false);
    }
  };

  const hasDraft = item.drafts && item.drafts.length > 0;
  const draft = hasDraft ? item.drafts[0] : null;

  // Check freshness (warning if > 18 hours old)
  const ageMs = Date.now() - new Date(item.publishedAt || item.discoveredAt).getTime();
  const isStale = ageMs > 18 * 60 * 60 * 1000;

  return (
    <div className={styles.container}>
      <Link href="/admin/news" className={styles.backLink}>
        <ArrowLeft size={14} />
        <span>Back to News Queue</span>
      </Link>

      {/* Freshness warning if stale */}
      {isStale && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            color: '#92400e',
            fontSize: '0.825rem',
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={16} color="#d97706" />
          <span>
            <strong>Potentially stale story:</strong> This item was published/discovered over 18 hours ago. Please verify that the latest facts, developments, and timelines are still current before publishing.
          </span>
        </div>
      )}

      {/* Main Header card */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <span className={styles.categoryTag}>
            {item.category?.name || 'General News'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {feedback && (
              <span
                style={{
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  color: 'var(--color-accent, #1a3a8b)',
                }}
              >
                {feedback}
              </span>
            )}
            <span
              className={`${styles.statusBadge} ${styles['status_' + status.toLowerCase()]}`}
            >
              {status}
            </span>
          </div>
        </div>

        <h1 className={styles.title}>{item.title}</h1>

        <div className={styles.metaRow}>
          <span>Source: <strong>{item.source.name}</strong></span>
          <span>•</span>
          {item.author && (
            <>
              <span>By {item.author}</span>
              <span>•</span>
            </>
          )}
          {item.publishedAt ? (
            <span>Published {formatDate(item.publishedAt)} ({formatRelativeTime(item.publishedAt)})</span>
          ) : (
            <span>Discovered {formatRelativeTime(item.discoveredAt)}</span>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className={styles.actionsBar}>
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <ExternalLink size={14} />
            <span>Open Original Story ↗</span>
          </a>

          {/* AI Drafting button */}
          <button
            onClick={() => setAiModalOpen(true)}
            className={`${styles.btn} ${styles.btnAi}`}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid #0f172a',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Generate Article Draft with AI</span>
          </button>

          {hasDraft ? (
            <Link
              href={`/admin/drafts/${draft!.id}`}
              className={`${styles.btn} ${styles.btnSuccess}`}
            >
              <FileEdit size={14} />
              <span>Open Existing Draft ({draft!.status})</span>
            </Link>
          ) : (
            <button onClick={handleCreateManualDraft} className={styles.btn}>
              <FileEdit size={14} />
              <span>Create Blank Draft</span>
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            {status !== 'APPROVED' && (
              <button
                onClick={() => handleStatusUpdate('APPROVED')}
                className={styles.btn}
                title="Mark story as Approved"
              >
                <CheckCircle size={14} color="#16a34a" />
                <span>Approve</span>
              </button>
            )}

            {status !== 'REJECTED' && (
              <button
                onClick={() => handleStatusUpdate('REJECTED')}
                className={styles.btn}
                title="Reject story"
              >
                <XCircle size={14} color="#dc2626" />
                <span>Reject</span>
              </button>
            )}

            {status !== 'ARCHIVED' && (
              <button
                onClick={() => handleStatusUpdate('ARCHIVED')}
                className={styles.btn}
                title="Archive story"
              >
                <Archive size={14} color="#666" />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Details & Notes */}
      <div className={styles.grid}>
        {/* Left Column: Description & Metadata */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h2 className={styles.cardHeading}>Wire Summary & Content</h2>
            <div className={styles.contentBody}>
              {item.description ? (
                <p className={styles.descriptionText}>{item.description}</p>
              ) : (
                <p className={styles.emptyText}>No wire description available for this story.</p>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardHeading}>Source & Ingestion Metadata</h2>
            <div className={styles.metadataList}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Source Feed</span>
                <span className={styles.metaVal}>{item.source.name}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Source Type</span>
                <span className={styles.metaVal}>{item.source.type.toUpperCase()}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Original URL</span>
                <a
                  href={item.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.urlLink}
                >
                  {item.originalUrl}
                </a>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Category Beat</span>
                <span className={styles.metaVal}>{item.category?.name || 'Unassigned'}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Ingestion Timestamp</span>
                <span className={styles.metaVal}>{formatDate(item.discoveredAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Checklist & Notes */}
        <div className={styles.rightCol}>
          {/* Review Checklist */}
          <div className={styles.card}>
            <h2 className={styles.cardHeading}>Editorial Review Checklist</h2>
            <p className={styles.cardSub}>Check off verification tasks as you review the story.</p>
            <div className={styles.checklist}>
              {DEFAULT_CHECKLIST.map((text, idx) => {
                const isChecked = checkedItems.includes(text);
                return (
                  <label key={idx} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleChecklist(text)}
                      className={styles.checkbox}
                    />
                    <span className={isChecked ? styles.checkedText : ''}>{text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Internal Notes */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 className={styles.cardHeading} style={{ margin: 0 }}>Internal Editorial Notes</h2>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                <Save size={12} />
                <span>{savingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
            <textarea
              className={styles.notesTextarea}
              placeholder="Add editorial notes, fact-checking instructions, or source cross-references..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </div>

      {/* AI Draft Generation Modal */}
      {aiModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="#2563eb" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  AI-Assisted Article Drafting
                </h2>
              </div>
              {!generatingAI && (
                <button
                  onClick={() => setAiModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {aiError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.825rem',
                }}
              >
                {aiError}
              </div>
            )}

            {generatingAI ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={36} className={styles.spinner} color="#2563eb" />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>{generationStep}</p>
                <p style={{ fontSize: '0.775rem', color: '#64748b', maxWidth: '400px' }}>
                  Synthesizing verified facts into an original, structured editorial draft. Human review and approval will be required prior to publishing.
                </p>
              </div>
            ) : (
              <>
                {/* Draft Mode Selection */}
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Article Drafting Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setAiMode('standard')}
                      style={{
                        padding: '0.75rem',
                        border: aiMode === 'standard' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: aiMode === 'standard' ? '#eff6ff' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                        Standard News Article
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Thorough 600–900 word synthesis with context, why it matters, and next steps.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiMode('breaking')}
                      style={{
                        padding: '0.75rem',
                        border: aiMode === 'breaking' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: aiMode === 'breaking' ? '#eff6ff' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                        Breaking News Dispatch
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Fast, concise 300–500 word dispatch highlighting confirmed facts and developing details.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Primary Source Reference */}
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>Primary Source: </span>
                  <span style={{ color: '#0f172a' }}>{item.source.name} ({item.originalUrl})</span>
                </div>

                {/* Additional Corroborating Sources */}
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Additional Corroborating Sources (Optional)
                  </label>
                  {additionalSources.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px',
                        marginBottom: '0.3rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span><strong>{s.name}:</strong> {s.url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(idx)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Source name (e.g. Reuters)"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      style={{ flex: 2, padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSource}
                      className={styles.btn}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Editor Notes */}
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    Editorial Guidance / Angle Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    placeholder="e.g., Emphasize market impact in India, focus on regulatory scrutiny..."
                    style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                {/* Existing Draft Warning */}
                {hasDraft && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#92400e',
                    }}
                  >
                    <strong>Notice:</strong> An editorial draft already exists for this wire item (<em>{draft!.title}</em>). You can generate a new version or overwrite the existing draft.
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setAiModalOpen(false)}
                    className={styles.btn}
                  >
                    Cancel
                  </button>

                  {hasDraft && (
                    <button
                      type="button"
                      onClick={() => handleGenerateAIDraft(draft!.id)}
                      className={styles.btn}
                      style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }}
                    >
                      <Sparkles size={14} />
                      <span>Overwrite Draft</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleGenerateAIDraft()}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    <Sparkles size={14} />
                    <span>{hasDraft ? 'Generate New Draft Version' : 'Generate Article Draft'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
