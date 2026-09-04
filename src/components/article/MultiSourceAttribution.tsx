import React from 'react';
import { Source } from '@/lib/types';
import { Layers } from 'lucide-react';
import styles from './MultiSourceAttribution.module.css';

interface MultiSourceAttributionProps {
  sources?: Source[];
}

export default function MultiSourceAttribution({ sources }: MultiSourceAttributionProps) {
  if (!sources || sources.length <= 1) {
    return null;
  }

  return (
    <div className={styles.container} role="region" aria-label="Multi-source attribution">
      <div className={styles.headerRow}>
        <Layers size={16} className={styles.icon} />
        <span className={styles.heading}>Synthesized Multi-Source Coverage</span>
      </div>
      <p className={styles.description}>
        Cross-verified and synthesized across <strong>{sources.length} independent reporting sources</strong>:
      </p>
      <div className={styles.sourcesList}>
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceChip}
            title={`Read primary reporting from ${source.name}`}
          >
            <span>{source.name}</span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
