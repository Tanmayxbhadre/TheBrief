'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Power,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import styles from './DraftsList.module.css';

interface SourceItem {
  id: string;
  name: string;
  type: string;
  url: string;
  country: string | null;
  language: string | null;
  enabled: boolean;
  priority: number;
  lastFetch: string | null;
  lastError: string | null;
  healthStatus: 'healthy' | 'warning' | 'error' | 'disabled';
  itemCount: number;
  category?: { name: string; slug: string } | null;
  lastLog?: {
    status: string;
    itemsFound: number;
    newItems: number;
    duplicates: number;
    errorMessage: string | null;
    completedAt: string;
  } | null;
}

interface CollectionResult {
  sourcesProcessed: number;
  newItems: number;
  duplicates: number;
  failedSources: number;
}

export function SourceHealthManager() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [collectionSummary, setCollectionSummary] = useState<CollectionResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshSourcesList = async () => {
    try {
      const res = await fetch('/api/admin/sources');
      const data = await res.json();
      if (res.ok) {
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to reload sources:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function initSources() {
      try {
        const res = await fetch('/api/admin/sources');
        const data = await res.json();
        if (res.ok && !ignore) {
          setSources(data.sources || []);
        }
      } catch (err) {
        console.error('Failed to load sources:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initSources();

    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleSource = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      });

      if (res.ok) {
        setSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  enabled: !currentEnabled,
                  healthStatus: !currentEnabled ? 'healthy' : 'disabled',
                }
              : s
          )
        );
        setFeedback(`Source ${!currentEnabled ? 'enabled' : 'disabled'}.`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback('Failed to update source.');
    }
  };

  const handleFetchAllNews = async () => {
    setFetchingAll(true);
    setCollectionSummary(null);
    setFeedback('Connecting to wire sources & parsing RSS feeds...');

    try {
      const res = await fetch('/api/admin/news/collect', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        setCollectionSummary(data.data);
        setFeedback('News collection pipeline complete.');
        refreshSourcesList();
      } else {
        setFeedback(`Collection Error: ${data.error || 'Failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setFeedback(`Collection Error: ${msg}`);
    } finally {
      setFetchingAll(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Source Registry & Health</h1>
          <p className={styles.subtitle}>
            Monitor wire ingestion channels, response status, error logs, and collection cadence.
          </p>
        </div>

        <button
          onClick={handleFetchAllNews}
          disabled={fetchingAll}
          className={styles.newBtn}
        >
          <RefreshCw size={14} className={fetchingAll ? 'spin-icon' : ''} />
          <span>{fetchingAll ? 'Fetching News Pipeline...' : 'Fetch News Now'}</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: '#e8edf8',
            color: 'var(--color-accent, #1a3a8b)',
            fontSize: '0.825rem',
            fontWeight: 600,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {fetchingAll && <RefreshCw size={14} className="spin-icon" />}
          <span>{feedback}</span>
        </div>
      )}

      {/* Collection Summary Box */}
      {collectionSummary && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #059669',
            borderRadius: '6px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 700 }}>
            <CheckCircle size={18} />
            <span>Collection Batch Results</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Sources Processed</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{collectionSummary.sourcesProcessed}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>New Stories Discovered</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent, #1a3a8b)' }}>{collectionSummary.newItems}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Duplicates Skipped</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#666' }}>{collectionSummary.duplicates}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase' }}>Channel Errors</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: collectionSummary.failedSources > 0 ? '#c0392b' : '#059669' }}>
                {collectionSummary.failedSources}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sources Health Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Source Channel</th>
              <th className={styles.th} style={{ width: '90px' }}>Type</th>
              <th className={styles.th} style={{ width: '110px' }}>Status</th>
              <th className={styles.th} style={{ width: '130px' }}>Last Fetch</th>
              <th className={styles.th} style={{ width: '110px' }}>Items Total</th>
              <th className={styles.th}>Diagnostics / Error</th>
              <th className={styles.th} style={{ width: '110px', textAlign: 'right' }}>
                Toggle
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Loading registered wire channels...
                </td>
              </tr>
            ) : sources.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No sources registered in sourceRegistry.ts.
                </td>
              </tr>
            ) : (
              sources.map((src) => {
                return (
                  <tr key={src.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#171717', fontSize: '0.875rem' }}>
                          {src.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.7rem', color: '#777', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <span>Feed URL</span>
                            <ExternalLink size={10} />
                          </a>
                          {src.country && (
                            <span style={{ fontSize: '0.7rem', color: '#999' }}>· {src.country}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>
                        {src.type}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor:
                            src.healthStatus === 'healthy'
                              ? '#dcfce7'
                              : src.healthStatus === 'warning'
                              ? '#fef3c7'
                              : src.healthStatus === 'error'
                              ? '#fee2e2'
                              : '#f3f4f6',
                          color:
                            src.healthStatus === 'healthy'
                              ? '#166534'
                              : src.healthStatus === 'warning'
                              ? '#92400e'
                              : src.healthStatus === 'error'
                              ? '#991b1b'
                              : '#4b5563',
                        }}
                      >
                        {src.healthStatus === 'healthy' && <CheckCircle size={11} />}
                        {src.healthStatus === 'warning' && <AlertTriangle size={11} />}
                        {src.healthStatus === 'error' && <AlertCircle size={11} />}
                        {src.healthStatus === 'disabled' && <XCircle size={11} />}
                        {src.healthStatus}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.75rem', color: '#777' }}>
                        {src.lastFetch ? formatRelativeTime(src.lastFetch) : 'Never'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>{src.itemCount}</span>
                    </td>
                    <td className={styles.td}>
                      {src.lastError ? (
                        <span style={{ fontSize: '0.75rem', color: '#c0392b', display: 'block', maxWidth: '300px', wordBreak: 'break-word' }}>
                          {src.lastError}
                        </span>
                      ) : src.lastLog ? (
                        <span style={{ fontSize: '0.75rem', color: '#059669' }}>
                          Last run: {src.lastLog.newItems} new items, {src.lastLog.duplicates} dupes
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>Ready</span>
                      )}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleSource(src.id, src.enabled)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.3rem 0.6rem',
                          borderRadius: '3px',
                          border: '1px solid var(--color-border, #e6e6e3)',
                          backgroundColor: src.enabled ? '#ffffff' : '#f3f4f6',
                          color: src.enabled ? '#171717' : '#999',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Power size={11} color={src.enabled ? '#059669' : '#999'} />
                        <span>{src.enabled ? 'Enabled' : 'Disabled'}</span>
                      </button>
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
