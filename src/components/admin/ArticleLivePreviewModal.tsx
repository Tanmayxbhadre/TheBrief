'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import { Article } from '@/lib/types';
import ArticleHeader from '@/components/article/ArticleHeader';
import ArticleBody from '@/components/article/ArticleBody';
import QuickSummary from '@/components/article/QuickSummary';
import WhatYouNeedToKnow from '@/components/article/WhatYouNeedToKnow';
import Timeline from '@/components/article/Timeline';

interface ArticleLivePreviewModalProps {
  article: Article;
  onClose: () => void;
}

export function ArticleLivePreviewModal({ article, onClose }: ArticleLivePreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      {/* Preview Top Header Bar */}
      <div
        style={{
          backgroundColor: '#171717',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              backgroundColor: 'var(--color-accent, #1a3a8b)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '3px',
              letterSpacing: '0.08em',
            }}
          >
            EDITORIAL PREVIEW
          </span>
          <span style={{ fontSize: '0.8rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="#10b981" />
            Protected · Non-indexable (noindex) · Identical to public render
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            color: '#fff',
            cursor: 'pointer',
            padding: '0.3rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
          }}
        >
          <X size={18} />
          <span>Close Preview</span>
        </button>
      </div>

      {/* Preview Content Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg, #ffffff)',
          paddingBottom: '4rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <article itemScope itemType="https://schema.org/NewsArticle">
          <ArticleHeader article={article} />

          <div className="article-container">
            {article.quickSummary && article.quickSummary.length > 0 && (
              <QuickSummary points={article.quickSummary} />
            )}

            {article.whatYouNeedToKnow && (
              <WhatYouNeedToKnow data={article.whatYouNeedToKnow} />
            )}
          </div>

          <ArticleBody article={article} />

          {article.timeline && article.timeline.length > 0 && (
            <div className="article-container">
              <Timeline events={article.timeline} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
