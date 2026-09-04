'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';
import styles from './SocialShare.module.css';

interface SocialShareProps {
  title: string;
  url: string;
}

export default function SocialShare({ title, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={styles.container} aria-label="Share article">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Share2 size={14} color="#64748b" />
        <span className={styles.label}>Share:</span>
      </div>
      <div className={styles.buttonGroup}>
        {/* WhatsApp */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
          title="Share on WhatsApp"
        >
          WhatsApp
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=thebriefin`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
          title="Share on X"
        >
          X
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
          title="Share on LinkedIn"
        >
          LinkedIn
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareBtn}
          title="Share on Telegram"
        >
          Telegram
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={styles.shareBtn}
          title="Copy link to clipboard"
        >
          {copied ? <Check size={13} color="#16a34a" /> : <LinkIcon size={13} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
