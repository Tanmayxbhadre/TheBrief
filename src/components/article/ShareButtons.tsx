'use client';

import { useState } from 'react';
import { Link2, Share2, Check } from 'lucide-react';
import styles from './ShareButtons.module.css';

const XTwitterIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
        <XTwitterIcon size={14} />
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
