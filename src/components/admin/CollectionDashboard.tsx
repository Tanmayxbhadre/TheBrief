'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import styles from './DraftsList.module.css';

interface JobSummary {
  systemStatus: 'HEALTHY' | 'WARNING' | 'ERROR' | 'DISABLED';
  isStale: boolean;
  lastRun: string | null;
  lastSuccessfulRun: string | null;
  totalSourcesCount: number;
  enabledSourcesCount: number;
  healthySourcesCount: number;
  warningSourcesCount: number;
  failedSourcesCount: number;
  newItemsToday: number;
  duplicatesToday: number;
  runsTodayCount: number;
}

interface JobRecord {
  id: string;
  trigger: string;
  startedAt: string;
  completedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  sourcesProcessed: number;
  successfulSources: number;
  failedSources: number;
  itemsFound: number;
  itemsInserted: number;
  duplicates: number;
  durationMs: number;
  errorMessage: string | null;
  sourceErrors: string | null;
}

interface SourceHealthItem {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: number;
  lastFetch: string | null;
  lastSuccessfulFetch: string | null;
  lastError: string | null;
  consecutiveFailures: number;
}

export function CollectionDashboard() {
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [sources, setSources] = useState<SourceHealthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingNow, setFetchingNow] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/collection/jobs');
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setJobs(data.jobs || []);
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to load collection telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/admin/collection/jobs');
        const data = await res.json();
        if (res.ok && !ignore) {
          setSummary(data.summary);
          setJobs(data.jobs || []);
          setSources(data.sources || []);
        }
      } catch (err) {
        console.error('Failed to init collection telemetry:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleManualFetch = async () => {
    setFetchingNow(true);
    setFeedback('Connecting to feeds & executing collection job...');

    try {
      const res = await fetch('/api/admin/news/collect', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        const d = data.data;
        if (d.skipped) {
          setFeedback('Job skipped: A collection job is already running.');
        } else {
          setFeedback(
            `Collection completed: ${d.newItems} new stories, ${d.duplicates} duplicates from ${d.sourcesProcessed} sources.`
          );
        }
        await loadData();
      } else {
        setFeedback(`Error: ${data.error || 'Failed to collect news'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setFeedback(`Error: ${msg}`);
    } finally {
      setFetchingNow(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            COMPLETED
          </span>
        );
      case 'PARTIAL':
        return (
          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            FAILED
          </span>
        );
      case 'SKIPPED':
        return (
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            SKIPPED
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
            RUNNING
          </span>
        );
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>News Collection Telemetry</h1>
          <p className={styles.subtitle}>
            Monitor automatic RSS discovery, scheduler execution history, and source health.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleManualFetch}
            disabled={fetchingNow}
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={fetchingNow ? styles.spinner : ''} />
            <span>{fetchingNow ? 'Fetching Feeds...' : 'Fetch News Now'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: feedback.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${feedback.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`,
            color: feedback.startsWith('Error') ? '#991b1b' : '#166534',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            ×
          </button>
        </div>
      )}

      {/* Stale News Warning Banner */}
      {summary?.isStale && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', display: 'block' }}>
              Warning: News Collection May Be Stale
            </span>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309' }}>
              No successful collection job has completed in the past 2 hours. Ensure your Vercel Cron or GitHub Actions scheduler is actively configured with CRON_SECRET.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className={styles.metricCard} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>System Status</span>
            <Activity size={16} color={summary?.systemStatus === 'HEALTHY' ? '#16a34a' : '#d97706'} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {summary?.systemStatus || 'CHECKING...'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary?.runsTodayCount || 0} scheduled runs today
          </span>
        </div>

        <div className={styles.metricCard} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Last Successful Run</span>
            <Clock size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            {summary?.lastSuccessfulRun ? formatRelativeTime(summary.lastSuccessfulRun) : 'No recent run'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary?.lastSuccessfulRun ? formatDate(summary.lastSuccessfulRun) : 'Awaiting scheduler'}
          </span>
        </div>

        <div className={styles.metricCard} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>New Stories Today</span>
            <ShieldCheck size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {summary?.newItemsToday || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary?.duplicatesToday || 0} duplicates filtered
          </span>
        </div>

        <div className={styles.metricCard} style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Source Health</span>
            <Radio size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {summary?.healthySourcesCount || 0} / {summary?.enabledSourcesCount || 0} Healthy
          </div>
          <span style={{ fontSize: '0.75rem', color: summary?.failedSourcesCount ? '#dc2626' : '#64748b' }}>
            {summary?.failedSourcesCount ? `${summary.failedSourcesCount} source(s) failing` : 'All enabled feeds operating'}
          </span>
        </div>
      </div>

      {/* Collection Jobs History Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Recent Collection Execution History
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Showing last 30 runs</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading telemetry...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No collection jobs recorded yet. Trigger &quot;Fetch News Now&quot; above to run the first job.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Time</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Trigger</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Sources</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Discovered</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>New Items</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Duplicates</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Duration</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const isExpanded = expandedJobId === job.id;
                  let parsedErrors: Array<{ sourceId: string; sourceName: string; error: string }> = [];
                  if (job.sourceErrors) {
                    try {
                      parsedErrors = JSON.parse(job.sourceErrors);
                    } catch {}
                  }

                  return (
                    <React.Fragment key={job.id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{ fontWeight: 600 }}>{formatRelativeTime(job.startedAt)}</span>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{formatDate(job.startedAt)}</div>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{job.trigger}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{getStatusBadge(job.status)}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {job.successfulSources} / {job.sourcesProcessed}
                          {job.failedSources > 0 && (
                            <span style={{ color: '#dc2626', marginLeft: '4px', fontWeight: 600 }}>
                              ({job.failedSources} failed)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{job.itemsFound}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#16a34a', fontWeight: 600 }}>+{job.itemsInserted}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{job.duplicates}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>{(job.durationMs / 1000).toFixed(1)}s</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          {parsedErrors.length > 0 ? (
                            <button
                              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              <span>{parsedErrors.length} error(s)</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          ) : job.errorMessage ? (
                            <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{job.errorMessage}</span>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '0.75rem' }}>All sources OK</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && parsedErrors.length > 0 && (
                        <tr>
                          <td colSpan={9} style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.3rem' }}>
                              Source-level failures in this run:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#b91c1c' }}>
                              {parsedErrors.map((errItem, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>
                                  <strong>{errItem.sourceName}:</strong> {errItem.error}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sources Health Breakdown */}
      {sources.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0' }}>
            Registered News Feed Statuses
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Source</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Last Fetch</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Last Success</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Failures</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Last Error</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{src.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {src.enabled ? (
                        <span style={{ color: src.consecutiveFailures > 0 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                          {src.consecutiveFailures > 0 ? 'Warning' : 'Active'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Disabled</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>
                      {src.lastFetch ? formatRelativeTime(src.lastFetch) : 'Never'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>
                      {src.lastSuccessfulFetch ? formatRelativeTime(src.lastSuccessfulFetch) : 'Never'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: src.consecutiveFailures > 0 ? '#dc2626' : '#64748b', fontWeight: src.consecutiveFailures > 0 ? 700 : 400 }}>
                      {src.consecutiveFailures}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: src.lastError ? '#dc2626' : '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {src.lastError || 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources Quick Link Card */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>
            Need to enable/disable or tune RSS feeds?
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Configure source endpoints, priorities, and categories in the Source Registry.
          </span>
        </div>
        <Link
          href="/admin/sources"
          className={styles.btn}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span>Manage Sources</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </div>
  );
}
