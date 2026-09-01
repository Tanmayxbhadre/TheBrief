'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Wand2,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import slugify from 'slugify';
import { ArticleLivePreviewModal } from './ArticleLivePreviewModal';
import { PublishConfirmationModal } from './PublishConfirmationModal';
import { Article } from '@/lib/types';
import styles from './ArticleEditor.module.css';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ArticleEditorProps {
  initialDraft: {
    id: string;
    newsItemId?: string | null;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId?: string | null;
    category?: { id: string; name: string; slug: string } | null;
    authorName: string;
    featuredImage?: string | null;
    imageAlt?: string | null;
    status: string;
    seoTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    tags?: string | null;
    sources?: string | null;
    quickSummary?: string | null;
    whatYouNeedToKnow?: string | null;
    timeline?: string | null;
    internalNotes?: string | null;
    readingTime: number;
    aiGenerated?: boolean;
    aiProvider?: string | null;
    aiModel?: string | null;
    aiFlags?: string | null;
    publishedAt?: Date | string | null;
    updatedAt: Date | string;
    newsItem?: {
      id: string;
      title: string;
      originalUrl: string;
      source: { name: string; url: string };
    } | null;
  };
  categories: CategoryOption[];
}

export function ArticleEditor({ initialDraft, categories }: ArticleEditorProps) {
  const router = useRouter();
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Core Fields
  const [title, setTitle] = useState(initialDraft.title || '');
  const [slug, setSlug] = useState(initialDraft.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState(initialDraft.excerpt || '');
  const [content, setContent] = useState(initialDraft.content || '');
  const [categoryId, setCategoryId] = useState(initialDraft.categoryId || '');
  const [authorName, setAuthorName] = useState(initialDraft.authorName || 'THE BRIEF Editorial Team');
  const [featuredImage, setFeaturedImage] = useState(initialDraft.featuredImage || '');
  const [imageAlt, setImageAlt] = useState(initialDraft.imageAlt || '');
  const [readingTime, setReadingTime] = useState(initialDraft.readingTime || 3);
  const [internalNotes, setInternalNotes] = useState(initialDraft.internalNotes || '');
  const [status, setStatus] = useState(initialDraft.status || 'DRAFT');

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState(initialDraft.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialDraft.metaDescription || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialDraft.canonicalUrl || '');
  const [tagsInput, setTagsInput] = useState<string>(() => {
    try {
      if (initialDraft.tags) {
        const parsed = JSON.parse(initialDraft.tags);
        return Array.isArray(parsed) ? parsed.join(', ') : '';
      }
    } catch {}
    return 'News';
  });

  // Structured Sections
  const [sources, setSources] = useState<{ name: string; url: string }[]>(() => {
    try {
      if (initialDraft.sources) {
        const parsed = JSON.parse(initialDraft.sources);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ name: '', url: '' }];
  });

  const [quickSummary, setQuickSummary] = useState<string[]>(() => {
    try {
      if (initialDraft.quickSummary) {
        const parsed = JSON.parse(initialDraft.quickSummary);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [''];
  });

  const parsedWhatYouNeedToKnow = React.useMemo(() => {
    try {
      if (initialDraft.whatYouNeedToKnow) {
        return JSON.parse(initialDraft.whatYouNeedToKnow);
      }
    } catch {}
    return null;
  }, [initialDraft.whatYouNeedToKnow]);

  const [whatHappened, setWhatHappened] = useState(parsedWhatYouNeedToKnow?.whatHappened || '');
  const [whyItMatters, setWhyItMatters] = useState(parsedWhatYouNeedToKnow?.whyItMatters || '');
  const [keyDetails, setKeyDetails] = useState<string[]>(
    Array.isArray(parsedWhatYouNeedToKnow?.keyDetails) && parsedWhatYouNeedToKnow.keyDetails.length > 0
      ? parsedWhatYouNeedToKnow.keyDetails
      : ['']
  );
  const [whatsNext, setWhatsNext] = useState(parsedWhatYouNeedToKnow?.whatsNext || '');

  const [timelineEvents, setTimelineEvents] = useState<
    { date: string; title: string; description: string }[]
  >(() => {
    try {
      if (initialDraft.timeline) {
        const parsed = JSON.parse(initialDraft.timeline);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // AI Assistant States
  const [isAiGenerated, setIsAiGenerated] = useState(initialDraft.aiGenerated || false);
  const [aiProviderInfo, setAiProviderInfo] = useState(
    initialDraft.aiProvider ? `${initialDraft.aiProvider} (${initialDraft.aiModel || 'default'})` : null
  );
  const [verificationNotes, setVerificationNotes] = useState<string[]>(() => {
    try {
      if (initialDraft.aiFlags) {
        const parsed = JSON.parse(initialDraft.aiFlags);
        return parsed?.verificationNotes || [];
      }
    } catch {}
    return [];
  });

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [runningAiAction, setRunningAiAction] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [altHeadlines, setAltHeadlines] = useState<string[]>([]);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [selectedTextToRewrite, setSelectedTextToRewrite] = useState('');
  const [rewriteTone, setRewriteTone] = useState<'clarity' | 'concise' | 'informative' | 'grammar'>('clarity');
  const [factCheckClaims, setFactCheckClaims] = useState<
    Array<{ claim: string; status: string; note: string; sourceAttribution?: string }>
  >([]);

  // State management
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Auto-slug generator
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    markDirty();
    if (!slugManuallyEdited) {
      const generated = slugify(newTitle, { lower: true, strict: true, trim: true });
      setSlug(generated);
    }
    if (!seoTitle || seoTitle.startsWith(initialDraft.title)) {
      setSeoTitle(`${newTitle} — THE BRIEF`);
    }
  };

  // Toolbar actions
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    markDirty();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 10);
  };

  // Structured list helpers
  const handleAddSource = () => {
    setSources([...sources, { name: '', url: '' }]);
    markDirty();
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
    markDirty();
  };

  const handleSourceChange = (index: number, field: 'name' | 'url', value: string) => {
    const updated = [...sources];
    updated[index][field] = value;
    setSources(updated);
    markDirty();
  };

  const handleAddQuickSummary = () => {
    setQuickSummary([...quickSummary, '']);
    markDirty();
  };

  const handleRemoveQuickSummary = (index: number) => {
    setQuickSummary(quickSummary.filter((_, i) => i !== index));
    markDirty();
  };

  const handleQuickSummaryChange = (index: number, value: string) => {
    const updated = [...quickSummary];
    updated[index] = value;
    setQuickSummary(updated);
    markDirty();
  };

  const handleAddKeyDetail = () => {
    setKeyDetails([...keyDetails, '']);
    markDirty();
  };

  const handleRemoveKeyDetail = (index: number) => {
    setKeyDetails(keyDetails.filter((_, i) => i !== index));
    markDirty();
  };

  const handleKeyDetailChange = (index: number, value: string) => {
    const updated = [...keyDetails];
    updated[index] = value;
    setKeyDetails(updated);
    markDirty();
  };

  const handleAddTimeline = () => {
    setTimelineEvents([
      ...timelineEvents,
      { date: '', title: '', description: '' },
    ]);
    markDirty();
  };

  const handleRemoveTimeline = (index: number) => {
    setTimelineEvents(timelineEvents.filter((_, i) => i !== index));
    markDirty();
  };

  const handleTimelineChange = (
    index: number,
    field: 'date' | 'title' | 'description',
    value: string
  ) => {
    const updated = [...timelineEvents];
    updated[index][field] = value;
    setTimelineEvents(updated);
    markDirty();
  };

  // Save Draft API Call
  const handleSaveDraft = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const cleanTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const cleanSources = sources.filter((s) => s.name.trim() && s.url.trim());
      const cleanQuickSummary = quickSummary.filter((q) => q.trim());
      const cleanKeyDetails = keyDetails.filter((k) => k.trim());

      const whatYouNeedToKnowPayload =
        whatHappened.trim() || whyItMatters.trim() || cleanKeyDetails.length > 0 || whatsNext.trim()
          ? {
              whatHappened: whatHappened.trim(),
              whyItMatters: whyItMatters.trim(),
              keyDetails: cleanKeyDetails,
              whatsNext: whatsNext.trim(),
            }
          : null;

      const cleanTimeline = timelineEvents.filter(
        (t) => t.date.trim() && t.title.trim()
      );

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        categoryId: categoryId || null,
        authorName: authorName.trim(),
        featuredImage: featuredImage.trim() || null,
        imageAlt: imageAlt.trim() || null,
        seoTitle: seoTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        canonicalUrl: canonicalUrl.trim() || null,
        tags: cleanTags,
        sources: cleanSources,
        quickSummary: cleanQuickSummary,
        whatYouNeedToKnow: whatYouNeedToKnowPayload,
        timeline: cleanTimeline,
        internalNotes: internalNotes.trim() || null,
        readingTime,
        status,
      };

      const res = await fetch(`/api/admin/drafts/${initialDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsDirty(false);
        setFeedback('Draft saved successfully.');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback(data.error || 'Failed to save draft.');
      }
    } catch {
      setFeedback('Network error while saving draft.');
    } finally {
      setSaving(false);
    }
  };

  // AI Improvement Actions
  const handleRunAiAction = async (action: 'headline' | 'summary' | 'seo' | 'tags' | 'fact_check') => {
    setRunningAiAction(action);
    setAiFeedback(null);

    try {
      const cleanSources = sources.filter((s) => s.name.trim() && s.url.trim());
      const res = await fetch('/api/admin/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          title,
          excerpt,
          content,
          sources: cleanSources,
          categorySlug: categories.find((c) => c.id === categoryId)?.slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiFeedback(data.error || `Failed to run AI ${action}`);
        return;
      }

      if (action === 'headline' && data.result) {
        setTitle(data.result.headline);
        if (Array.isArray(data.result.alternatives)) {
          setAltHeadlines(data.result.alternatives);
        }
        markDirty();
        setAiFeedback('Primary headline updated and alternatives generated.');
      } else if (action === 'summary' && data.result) {
        if (Array.isArray(data.result.quickSummary)) {
          setQuickSummary(data.result.quickSummary);
          markDirty();
          setAiFeedback('Quick summary updated with 2-4 factual bullets.');
        }
      } else if (action === 'seo' && data.result) {
        if (data.result.seoTitle) setSeoTitle(data.result.seoTitle);
        if (data.result.metaDescription) setMetaDescription(data.result.metaDescription);
        markDirty();
        setAiFeedback('SEO Title and Meta Description optimized.');
      } else if (action === 'tags' && data.result) {
        if (Array.isArray(data.result.tags)) {
          setTagsInput(data.result.tags.join(', '));
          markDirty();
          setAiFeedback('Tags generated and applied.');
        }
      } else if (action === 'fact_check' && data.result) {
        if (Array.isArray(data.result.claims)) {
          setFactCheckClaims(data.result.claims);
        }
        if (data.result.reviewFlags?.verificationNotes) {
          setVerificationNotes(data.result.reviewFlags.verificationNotes);
        }
        setAiFeedback(data.result.overallAssessment || 'Fact-checking assessment completed.');
      }
    } catch (err) {
      setAiFeedback(err instanceof Error ? err.message : 'Network error during AI action');
    } finally {
      setRunningAiAction(null);
    }
  };

  // Text Selection Rewrite Handler
  const handleOpenRewriteModal = () => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setSelectedTextToRewrite(selected || '');
    }
    setRewriteModalOpen(true);
  };

  const handleExecuteRewrite = async () => {
    if (!selectedTextToRewrite.trim()) return;
    setRunningAiAction('rewrite');
    setAiFeedback(null);

    try {
      const res = await fetch('/api/admin/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewrite',
          selectedText: selectedTextToRewrite,
          instruction: rewriteTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiFeedback(data.error || 'Failed to rewrite text');
        return;
      }

      if (data.result?.rewrittenText) {
        const textarea = contentTextareaRef.current;
        if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const updated =
            content.substring(0, start) + data.result.rewrittenText + content.substring(end);
          setContent(updated);
        } else {
          setContent((prev) => `${prev}\n\n${data.result.rewrittenText}`);
        }
        markDirty();
        setRewriteModalOpen(false);
        setAiFeedback(`Selected text rewritten for ${rewriteTone}.`);
      }
    } catch (err) {
      setAiFeedback(err instanceof Error ? err.message : 'Rewrite error');
    } finally {
      setRunningAiAction(null);
    }
  };

  // Regenerate entire draft
  const handleRegenerateEntireDraft = async () => {
    if (!initialDraft.newsItemId) {
      setAiFeedback('Cannot regenerate: this draft is not linked to a source news item.');
      return;
    }

    setRunningAiAction('regenerate');
    setShowRegenerateConfirm(false);

    const steps = [
      'Preparing sources & wire context...',
      'Analyzing story & factual claims...',
      'Synthesizing structured article & summary...',
      'Generating SEO metadata & timeline...',
      'Validating output schema & saving draft...',
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
      const cleanSources = sources.filter((s) => s.name.trim() && s.url.trim());
      const res = await fetch('/api/admin/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsItemId: initialDraft.newsItemId,
          overwriteDraftId: initialDraft.id,
          additionalSources: cleanSources.slice(1),
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();
      if (res.ok && data.draft) {
        // Refresh with new data
        setTitle(data.draft.title);
        setSlug(data.draft.slug);
        setExcerpt(data.draft.excerpt);
        setContent(data.draft.content);
        if (data.draft.seoTitle) setSeoTitle(data.draft.seoTitle);
        if (data.draft.metaDescription) setMetaDescription(data.draft.metaDescription);
        if (data.draft.quickSummary) {
          try {
            setQuickSummary(JSON.parse(data.draft.quickSummary));
          } catch {}
        }
        if (data.draft.whatYouNeedToKnow) {
          try {
            const p = JSON.parse(data.draft.whatYouNeedToKnow);
            if (p.whatHappened) setWhatHappened(p.whatHappened);
            if (p.whyItMatters) setWhyItMatters(p.whyItMatters);
            if (p.keyDetails) setKeyDetails(p.keyDetails);
            if (p.whatsNext) setWhatsNext(p.whatsNext);
          } catch {}
        }
        if (data.draft.timeline) {
          try {
            setTimelineEvents(JSON.parse(data.draft.timeline));
          } catch {}
        }
        if (data.draft.tags) {
          try {
            setTagsInput(JSON.parse(data.draft.tags).join(', '));
          } catch {}
        }
        setIsAiGenerated(true);
        if (data.draft.aiProvider) {
          setAiProviderInfo(`${data.draft.aiProvider} (${data.draft.aiModel || 'default'})`);
        }
        if (data.draft.aiFlags) {
          try {
            setVerificationNotes(JSON.parse(data.draft.aiFlags).verificationNotes || []);
          } catch {}
        }
        setIsDirty(false);
        setFeedback('AI Draft regenerated successfully.');
      } else {
        setAiFeedback(data.error || 'Failed to regenerate draft');
      }
    } catch (err) {
      setAiFeedback(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setRunningAiAction(null);
    }
  };

  // Convert current form state into public Article interface for live preview
  const previewArticle: Article = {
    id: initialDraft.id,
    title: title.trim() || 'Untitled Article',
    slug: slug.trim() || 'preview-slug',
    description: excerpt.trim() || 'Article summary description',
    content: content.trim() || 'Article body content...',
    author: {
      id: 'author-1',
      name: authorName.trim() || 'THE BRIEF Editorial Team',
      slug: slugify(authorName.trim() || 'thebrief', { lower: true }),
    },
    category: {
      id: categoryId || 'cat-1',
      name: categories.find((c) => c.id === categoryId)?.name || 'General News',
      slug: categories.find((c) => c.id === categoryId)?.slug || 'news',
      description: '',
      seoTitle: '',
      seoDescription: '',
    },
    publishedAt: new Date().toISOString(),
    featuredImage:
      featuredImage.trim() ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop',
    imageAlt: imageAlt.trim() || title.trim(),
    tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    readingTime,
    sources: sources.filter((s) => s.name.trim() && s.url.trim()),
    quickSummary: quickSummary.filter((q) => q.trim()),
    whatYouNeedToKnow:
      whatHappened.trim() || whyItMatters.trim() || keyDetails.some((k) => k.trim()) || whatsNext.trim()
        ? {
            whatHappened: whatHappened.trim(),
            whyItMatters: whyItMatters.trim(),
            keyDetails: keyDetails.filter((k) => k.trim()),
            whatsNext: whatsNext.trim(),
          }
        : undefined,
    timeline: timelineEvents.filter((t) => t.date.trim() && t.title.trim()),
  };

  return (
    <div className={styles.container}>
      {/* Top Bar Navigation & Actions */}
      <div className={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/admin/drafts" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>All Drafts</span>
          </Link>
          <span className={`${styles.badge} ${styles['badge_' + status.toLowerCase()]}`}>
            {status}
          </span>
          {isAiGenerated && (
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Sparkles size={12} />
              <span>AI-Assisted</span>
            </span>
          )}
          {isDirty && <span className={styles.dirtyDot}>• Unsaved Changes</span>}
        </div>

        <div className={styles.topActions}>
          {feedback && <span className={styles.feedbackMsg}>{feedback}</span>}

          {/* AI Assistant Toggle Button */}
          <button
            type="button"
            onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
            className={`${styles.btn} ${styles.btnAi}`}
            style={{
              backgroundColor: aiDrawerOpen ? '#1e293b' : '#f8fafc',
              color: aiDrawerOpen ? '#ffffff' : '#0f172a',
              borderColor: '#cbd5e1',
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} color={aiDrawerOpen ? '#38bdf8' : '#2563eb'} />
            <span>AI Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className={styles.btn}
          >
            <Eye size={14} />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={publishing}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Globe size={14} />
            <span>Publish Article...</span>
          </button>
        </div>
      </div>

      {/* AI Verification Flags Banner (Section 24 / 54) */}
      {verificationNotes.length > 0 && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#92400e', display: 'block' }}>
              AI Editorial Verification Required ({verificationNotes.length} item{verificationNotes.length !== 1 ? 's' : ''})
            </span>
            <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: '#b45309' }}>
              {verificationNotes.map((note, idx) => (
                <li key={idx} style={{ marginBottom: '2px' }}>{note}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setVerificationNotes([])}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#b45309',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Dismiss All
          </button>
        </div>
      )}

      {/* AI Fact-Check Claims Panel (Sections 25, 33) */}
      {factCheckClaims.length > 0 && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a' }}>
              AI Claim Fact-Checking ({factCheckClaims.length} evaluated)
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
              AI-assisted verification. Editor confirmation required.
            </span>
            <button
              onClick={() => setFactCheckClaims([])}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {factCheckClaims.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px',
                      backgroundColor:
                        item.status === 'verified'
                          ? '#dcfce7'
                          : item.status === 'conflicting'
                          ? '#fee2e2'
                          : '#fef3c7',
                      color:
                        item.status === 'verified'
                          ? '#166534'
                          : item.status === 'conflicting'
                          ? '#991b1b'
                          : '#92400e',
                    }}
                  >
                    {item.status}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.claim}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {item.note} {item.sourceAttribution ? `• Source: ${item.sourceAttribution}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className={styles.editorLayout}>
        {/* Main Writing Desk (Left Column) */}
        <div className={styles.mainCol}>
          {/* Article Title */}
          <div className={styles.sectionCard}>
            <label className={styles.fieldLabel}>
              Article Headline <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              className={styles.titleInput}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter crisp, authoritative headline..."
            />

            {/* Alternative Headlines if generated by AI */}
            {altHeadlines.length > 0 && (
              <div style={{ marginTop: '0.6rem', padding: '0.6rem', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                  Alternative AI Headlines (Click to use):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {altHeadlines.map((alt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTitleChange(alt)}
                      style={{
                        textAlign: 'left',
                        padding: '0.3rem 0.5rem',
                        fontSize: '0.775rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Slug Editor */}
            <div className={styles.slugRow}>
              <span className={styles.slugPrefix}>thebrief.in/[category]/</span>
              <input
                type="text"
                className={styles.slugInput}
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value, { lower: true, strict: true }));
                  setSlugManuallyEdited(true);
                  markDirty();
                }}
                placeholder="url-slug"
              />
            </div>
          </div>

          {/* Excerpt / Lead Summary */}
          <div className={styles.sectionCard}>
            <div className={styles.labelWithCount}>
              <label className={styles.fieldLabel}>
                Lead Excerpt / Meta Overview <span className={styles.req}>*</span>
              </label>
              <span
                className={`${styles.charCounter} ${
                  excerpt.length > 160 ? styles.charOver : ''
                }`}
              >
                {excerpt.length} / 160 chars
              </span>
            </div>
            <textarea
              className={styles.textarea}
              rows={3}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                markDirty();
              }}
              placeholder="1-2 sentence lead overview synthesizing the key news development..."
            />
          </div>

          {/* Quick Summary (Bullets) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Quick Summary (2–4 Bullet Points)</h3>
                <p className={styles.sectionSub}>Concise facts for fast reader consumption.</p>
              </div>
              <button
                type="button"
                onClick={handleAddQuickSummary}
                className={styles.addBtn}
              >
                <Plus size={13} />
                <span>Add Bullet</span>
              </button>
            </div>

            <div className={styles.listWrapper}>
              {quickSummary.map((bullet, idx) => (
                <div key={idx} className={styles.listItem}>
                  <span className={styles.bulletDot}>•</span>
                  <input
                    type="text"
                    className={styles.listInput}
                    value={bullet}
                    onChange={(e) => handleQuickSummaryChange(idx, e.target.value)}
                    placeholder={`Key takeaway point ${idx + 1}...`}
                  />
                  {quickSummary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuickSummary(idx)}
                      className={styles.deleteBtn}
                      title="Remove bullet"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Article Body with Formatting Toolbar */}
          <div className={styles.sectionCard}>
            <div className={styles.labelWithCount}>
              <label className={styles.fieldLabel}>
                Article Content (Markdown) <span className={styles.req}>*</span>
              </label>
              <button
                type="button"
                onClick={handleOpenRewriteModal}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Wand2 size={13} />
                <span>Rewrite Selection</span>
              </button>
            </div>

            {/* Markdown Toolbar */}
            <div className={styles.toolbar}>
              <button
                type="button"
                onClick={() => insertFormatting('## ', '\n')}
                className={styles.toolbarBtn}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ', '\n')}
                className={styles.toolbarBtn}
                title="Heading 3"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className={styles.toolbarBtn}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className={styles.toolbarBtn}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '\n')}
                className={styles.toolbarBtn}
                title="Blockquote"
              >
                &ldquo; Quote
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ', '\n')}
                className={styles.toolbarBtn}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[', '](https://...)')}
                className={styles.toolbarBtn}
                title="Link"
              >
                🔗 Link
              </button>
            </div>

            <textarea
              ref={contentTextareaRef}
              className={`${styles.textarea} ${styles.bodyTextarea}`}
              rows={16}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                markDirty();
              }}
              placeholder="Write the full news analysis here using Markdown. Use ## for section headings..."
            />
          </div>

          {/* What You Need To Know Structured Breakdown */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>What You Need To Know (Structured Breakdown)</h3>
                <p className={styles.sectionSub}>Comprehensive editorial synthesis breakdown.</p>
              </div>
            </div>

            <div className={styles.structuredForm}>
              <div>
                <label className={styles.subLabel}>1. What Happened?</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={whatHappened}
                  onChange={(e) => {
                    setWhatHappened(e.target.value);
                    markDirty();
                  }}
                  placeholder="Clear explanation of the news event..."
                />
              </div>

              <div>
                <label className={styles.subLabel}>2. Why It Matters</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={whyItMatters}
                  onChange={(e) => {
                    setWhyItMatters(e.target.value);
                    markDirty();
                  }}
                  placeholder="The broader economic, social, or technological implications..."
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label className={styles.subLabel}>3. Key Details & Metrics</label>
                  <button
                    type="button"
                    onClick={handleAddKeyDetail}
                    className={styles.addBtnSmall}
                  >
                    + Add Detail
                  </button>
                </div>
                {keyDetails.map((detail, idx) => (
                  <div key={idx} className={styles.listItem}>
                    <input
                      type="text"
                      className={styles.listInput}
                      value={detail}
                      onChange={(e) => handleKeyDetailChange(idx, e.target.value)}
                      placeholder={`Key detail ${idx + 1}...`}
                    />
                    {keyDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyDetail(idx)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className={styles.subLabel}>4. What&apos;s Next?</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={whatsNext}
                  onChange={(e) => {
                    setWhatsNext(e.target.value);
                    markDirty();
                  }}
                  placeholder="Expected upcoming milestones, trials, or rollouts..."
                />
              </div>
            </div>
          </div>

          {/* Timeline Events */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Timeline of Events (Optional)</h3>
                <p className={styles.sectionSub}>Chronological progression for developing stories.</p>
              </div>
              <button
                type="button"
                onClick={handleAddTimeline}
                className={styles.addBtn}
              >
                <Plus size={13} />
                <span>Add Event</span>
              </button>
            </div>

            <div className={styles.listWrapper}>
              {timelineEvents.map((event, idx) => (
                <div key={idx} className={styles.timelineItemCard}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Date (e.g. Aug 31)"
                      value={event.date}
                      onChange={(e) => handleTimelineChange(idx, 'date', e.target.value)}
                      className={styles.timelineDateInput}
                    />
                    <input
                      type="text"
                      placeholder="Milestone Headline"
                      value={event.title}
                      onChange={(e) => handleTimelineChange(idx, 'title', e.target.value)}
                      className={styles.timelineTitleInput}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeline(idx)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Brief description of what occurred..."
                    value={event.description}
                    onChange={(e) => handleTimelineChange(idx, 'description', e.target.value)}
                    className={styles.listInput}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Settings & Metadata (Right Column) */}
        <div className={styles.sidebarCol}>
          {/* AI Assistant Drawer Panel */}
          {aiDrawerOpen && (
            <div
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                border: '1px solid #0f172a',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    AI Editorial Assistant
                  </span>
                </div>
                <button
                  onClick={() => setAiDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              {aiProviderInfo && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Engine: <strong style={{ color: '#e2e8f0' }}>{aiProviderInfo}</strong>
                </div>
              )}

              {runningAiAction === 'regenerate' && generationStep && (
                <div style={{ padding: '0.5rem 0.65rem', backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '4px', fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Loader2 size={13} className={styles.spinner} />
                  <span>{generationStep}</span>
                </div>
              )}

              {aiFeedback && (
                <div style={{ padding: '0.4rem 0.6rem', backgroundColor: '#334155', borderRadius: '4px', fontSize: '0.75rem', color: '#38bdf8' }}>
                  {aiFeedback}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Granular Improvements
                </span>

                <button
                  type="button"
                  onClick={() => handleRunAiAction('headline')}
                  disabled={runningAiAction !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>📰 Suggest Headlines</span>
                  {runningAiAction === 'headline' ? <Loader2 size={13} className={styles.spinner} /> : <ChevronRight size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleRunAiAction('summary')}
                  disabled={runningAiAction !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>📝 Enhance Quick Summary</span>
                  {runningAiAction === 'summary' ? <Loader2 size={13} className={styles.spinner} /> : <ChevronRight size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleRunAiAction('seo')}
                  disabled={runningAiAction !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>🎯 Optimize SEO Metadata</span>
                  {runningAiAction === 'seo' ? <Loader2 size={13} className={styles.spinner} /> : <ChevronRight size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleRunAiAction('tags')}
                  disabled={runningAiAction !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>🏷️ Suggest Topic Tags</span>
                  {runningAiAction === 'tags' ? <Loader2 size={13} className={styles.spinner} /> : <ChevronRight size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => handleRunAiAction('fact_check')}
                  disabled={runningAiAction !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.775rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>🔍 Fact-Check / Verify Claims</span>
                  {runningAiAction === 'fact_check' ? <Loader2 size={13} className={styles.spinner} /> : <ChevronRight size={13} />}
                </button>

                {initialDraft.newsItemId && (
                  <button
                    type="button"
                    onClick={() => setShowRegenerateConfirm(true)}
                    disabled={runningAiAction !== null}
                    style={{
                      marginTop: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.65rem',
                      backgroundColor: '#b91c1c',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Regenerate Entire Draft...</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Connected Wire Story Details */}
          {initialDraft.newsItem && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Source Wire Story</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#171717', margin: '0.25rem 0' }}>
                {initialDraft.newsItem.title}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.725rem', color: '#666' }}>
                  {initialDraft.newsItem.source.name}
                </span>
                <a
                  href={initialDraft.newsItem.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.725rem', color: 'var(--color-accent, #1a3a8b)', fontWeight: 600 }}
                >
                  Open Wire ↗
                </a>
              </div>
            </div>
          )}

          {/* Publishing Metadata & Status */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Publishing & Beat</h3>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Editorial Status</label>
              <select
                className={styles.select}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  markDirty();
                }}
              >
                <option value="DRAFT">DRAFT (Work in progress)</option>
                <option value="REVIEW">REVIEW (Ready for edit review)</option>
                <option value="APPROVED">APPROVED (Ready to publish)</option>
                <option value="ARCHIVED">ARCHIVED (Unpublished)</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Category Beat <span className={styles.req}>*</span>
              </label>
              <select
                className={styles.select}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  markDirty();
                }}
              >
                <option value="">Select Category Beat...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Byline / Author</label>
              <input
                type="text"
                className={styles.input}
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  markDirty();
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Reading Time (minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                className={styles.input}
                value={readingTime}
                onChange={(e) => {
                  setReadingTime(parseInt(e.target.value, 10) || 3);
                  markDirty();
                }}
              />
            </div>
          </div>

          {/* Source Attribution (Mandatory) */}
          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.cardTitle}>Source Attribution <span className={styles.req}>*</span></h3>
              <button
                type="button"
                onClick={handleAddSource}
                className={styles.addBtnSmall}
              >
                + Add Source
              </button>
            </div>
            <p className={styles.sectionSub}>Required: Primary reporting must be attributed.</p>

            <div className={styles.listWrapper}>
              {sources.map((src, idx) => (
                <div key={idx} className={styles.sourceItem}>
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <input
                      type="text"
                      placeholder="Source (e.g. Reuters)"
                      value={src.name}
                      onChange={(e) => handleSourceChange(idx, 'name', e.target.value)}
                      className={styles.input}
                    />
                    {sources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(idx)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://original-story-url.com"
                    value={src.url}
                    onChange={(e) => handleSourceChange(idx, 'url', e.target.value)}
                    className={styles.input}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Featured Media</h3>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Image URL</label>
              <input
                type="url"
                className={styles.input}
                value={featuredImage}
                onChange={(e) => {
                  setFeaturedImage(e.target.value);
                  markDirty();
                }}
                placeholder="https://..."
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Image Alt Text</label>
              <input
                type="text"
                className={styles.input}
                value={imageAlt}
                onChange={(e) => {
                  setImageAlt(e.target.value);
                  markDirty();
                }}
                placeholder="Descriptive caption for accessibility"
              />
            </div>
          </div>

          {/* SEO & Discoverability */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Search & Social SEO</h3>

            <div className={styles.fieldGroup}>
              <div className={styles.labelWithCount}>
                <label className={styles.fieldLabel}>SEO Title</label>
                <span
                  className={`${styles.charCounter} ${
                    seoTitle.length > 60 ? styles.charOver : ''
                  }`}
                >
                  {seoTitle.length} / 60
                </span>
              </div>
              <input
                type="text"
                className={styles.input}
                value={seoTitle}
                onChange={(e) => {
                  setSeoTitle(e.target.value);
                  markDirty();
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelWithCount}>
                <label className={styles.fieldLabel}>Meta Description</label>
                <span
                  className={`${styles.charCounter} ${
                    metaDescription.length > 160 ? styles.charOver : ''
                  }`}
                >
                  {metaDescription.length} / 160
                </span>
              </div>
              <textarea
                className={styles.textarea}
                rows={3}
                value={metaDescription}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  markDirty();
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Canonical URL (Optional)</label>
              <input
                type="url"
                className={styles.input}
                value={canonicalUrl}
                onChange={(e) => {
                  setCanonicalUrl(e.target.value);
                  markDirty();
                }}
                placeholder="https://thebrief.in/..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Topic Tags (Comma-separated)</label>
              <input
                type="text"
                className={styles.input}
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                  markDirty();
                }}
                placeholder="Technology, AI, Google, Hardware"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Internal Editorial Notes</h3>
            <textarea
              className={styles.textarea}
              rows={3}
              value={internalNotes}
              onChange={(e) => {
                setInternalNotes(e.target.value);
                markDirty();
              }}
              placeholder="Private notes for the newsroom..."
            />
          </div>
        </div>
      </div>

      {/* Text Selection Rewrite Modal */}
      {rewriteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '550px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Wand2 size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Rewrite Selected Excerpt</h3>
              </div>
              <button
                onClick={() => setRewriteModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                Target Phrasing Objective:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {(['clarity', 'concise', 'informative', 'grammar'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setRewriteTone(tone)}
                    style={{
                      padding: '0.5rem',
                      border: rewriteTone === tone ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '4px',
                      backgroundColor: rewriteTone === tone ? '#eff6ff' : '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                Excerpt to Rewrite:
              </label>
              <textarea
                rows={4}
                value={selectedTextToRewrite}
                onChange={(e) => setSelectedTextToRewrite(e.target.value)}
                placeholder="Highlight text in editor before clicking rewrite..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.825rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRewriteModalOpen(false)}
                className={styles.btn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRewrite}
                disabled={runningAiAction === 'rewrite' || !selectedTextToRewrite.trim()}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {runningAiAction === 'rewrite' ? <Loader2 size={13} className={styles.spinner} /> : <Wand2 size={13} />}
                <span>Apply AI Rewrite</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Regeneration Overwrite Modal */}
      {showRegenerateConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#dc2626" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#991b1b' }}>
                Regenerate AI Draft?
              </h3>
            </div>
            {isDirty && (
              <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.775rem', color: '#991b1b', fontWeight: 600 }}>
                ⚠️ Warning: You have unsaved manual edits that will be permanently overwritten.
              </div>
            )}
            <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Regenerating will replace your current draft content, headline, summary, and structured sections with a freshly synthesized AI version.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowRegenerateConfirm(false)}
                className={styles.btn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateEntireDraft}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
              >
                Yes, Regenerate Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <ArticleLivePreviewModal
          onClose={() => setShowPreviewModal(false)}
          article={previewArticle}
        />
      )}

      {/* Pre-Flight Checklist & Publish Confirmation Modal */}
      {showPublishModal && (
        <PublishConfirmationModal
          draft={{
            id: initialDraft.id,
            title,
            slug,
            excerpt,
            content,
            categoryId,
            categoryName: categories.find((c) => c.id === categoryId)?.name,
            categorySlug: categories.find((c) => c.id === categoryId)?.slug,
            authorName,
            seoTitle,
            metaDescription,
            sources: sources.filter((s) => s.name.trim() && s.url.trim()),
          }}
          onClose={() => setShowPublishModal(false)}
          onConfirmPublish={async () => {
            setPublishing(true);
            try {
              await handleSaveDraft();
              const res = await fetch(`/api/admin/articles/${initialDraft.id}/publish`, {
                method: 'POST',
              });
              const data = await res.json();
              if (res.ok) {
                setStatus('PUBLISHED');
                setIsDirty(false);
                setShowPublishModal(false);
                router.push('/admin/articles');
              } else {
                setFeedback(data.error || 'Publishing failed');
              }
            } catch {
              setFeedback('Publishing failed');
            } finally {
              setPublishing(false);
            }
          }}
          publishing={publishing}
        />
      )}
    </div>
  );
}
