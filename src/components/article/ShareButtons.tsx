'use client';

import { useState } from 'react';
import { Link2, Twitter, Share2, Check } from 'lucide-react';
import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select and copy
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error — do nothing
      }
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={styles.wrapper} role="group" aria-label="Share this article">
      <span className={styles.label}>Share</span>

      {/* Copy link */}
      <button
        className={`${styles.btn} ${copied ? styles.btnSuccess : ''}`}
        onClick={handleCopyLink}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title="Copy link"
      >
        {copied ? <Check size={15} strokeWidth={2} /> : <Link2 size={15} strokeWidth={2} />}
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>

      {/* Twitter/X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.btn}
        aria-label="Share on X (Twitter)"
        title="Share on X (Twitter)"
      >
        <Twitter size={15} strokeWidth={2} />
        <span>Share</span>
      </a>

      {/* Native share (mobile) */}
      {hasNativeShare && (
        <button
          className={styles.btn}
          onClick={handleNativeShare}
          aria-label="Share via..."
          title="Share via..."
        >
          <Share2 size={15} strokeWidth={2} />
          <span>More</span>
        </button>
      )}
    </div>
  );
}
