'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle, Globe, ShieldAlert } from 'lucide-react';

interface PublishConfirmationModalProps {
  draft: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId?: string;
    categoryName?: string;
    categorySlug?: string;
    authorName: string;
    seoTitle: string;
    metaDescription: string;
    sources: { name: string; url: string }[];
  };
  onClose: () => void;
  onConfirmPublish: () => Promise<void>;
  publishing: boolean;
}

export function PublishConfirmationModal({
  draft,
  onClose,
  onConfirmPublish,
  publishing,
}: PublishConfirmationModalProps) {
  // Validate checklist
  const checks = [
    { label: 'Article Title provided', valid: !!draft.title?.trim() },
    { label: 'URL-safe slug generated', valid: !!draft.slug?.trim() },
    { label: 'Editorial category selected', valid: !!draft.categoryId },
    { label: 'Article excerpt / summary written', valid: !!draft.excerpt?.trim() },
    { label: 'Body content & analysis written', valid: !!draft.content?.trim() },
    { label: 'Byline / Author assigned', valid: !!draft.authorName?.trim() },
    { label: 'SEO Title configured', valid: !!draft.seoTitle?.trim() },
    { label: 'Meta Description configured', valid: !!draft.metaDescription?.trim() },
    {
      label: 'Original reporting source attributed',
      valid: Array.isArray(draft.sources) && draft.sources.length > 0 && !!draft.sources[0].url,
    },
  ];

  const allValid = checks.every((c) => c.valid);

  const liveUrlPath = `/${draft.categorySlug || 'news'}/${draft.slug}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border, #e6e6e3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="var(--color-accent, #1a3a8b)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#171717' }}>
              Publish Article to TheBrief
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={publishing}
            style={{ color: '#666', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-accent, #1a3a8b)',
              }}
            >
              {draft.categoryName || 'General News'}
            </span>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#171717',
                lineHeight: 1.3,
                marginTop: '2px',
              }}
            >
              {draft.title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
              Target live route: <code style={{ color: 'var(--color-accent, #1a3a8b)' }}>{liveUrlPath}</code>
            </p>
          </div>

          {/* Validation Checklist */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary, #f7f7f5)',
              border: '1px solid var(--color-border, #e6e6e3)',
              borderRadius: '6px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>
              Pre-Flight Editorial Checklist
            </span>
            {checks.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                {c.valid ? (
                  <CheckCircle size={15} color="#059669" />
                ) : (
                  <AlertCircle size={15} color="#dc2626" />
                )}
                <span style={{ color: c.valid ? '#171717' : '#dc2626', fontWeight: c.valid ? 400 : 600 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {allValid ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#065f46',
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Ready to publish!</strong> This article will become publicly visible across the homepage, category feed, daily news, and Google Search.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#991b1b',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Please resolve the incomplete checklist items before publishing to ensure high journalism quality.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border, #e6e6e3)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          <button
            onClick={onClose}
            disabled={publishing}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              border: '1px solid var(--color-border, #e6e6e3)',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirmPublish}
            disabled={!allValid || publishing}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid var(--color-accent-dark, #122977)',
              backgroundColor: allValid ? 'var(--color-accent, #1a3a8b)' : '#9ca3af',
              color: '#ffffff',
              cursor: allValid && !publishing ? 'pointer' : 'not-allowed',
            }}
          >
            {publishing ? 'Publishing Story...' : 'Publish Article Now →'}
          </button>
        </div>
      </div>
    </div>
  );
}
