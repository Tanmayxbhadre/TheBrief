'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import styles from './ClusterManager.module.css';

export interface StoryClusterItem {
  id: string;
  title: string;
  canonicalTitle: string;
  slug: string;
  summary?: string;
  category: string;
  categorySlug: string;
  status: string;
  sourceCount: number;
  importanceScore: number;
  trendingScore: number;
  isBreaking: boolean;
  sources: string[];
  itemCount: number;
  leadImageUrl?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  draft?: { id: string; slug: string; status: string; title: string } | null;
}

interface ClusterManagerProps {
  initialClusters: StoryClusterItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function ClusterManager({ initialClusters, categories }: ClusterManagerProps) {
  const router = useRouter();
  const [clusters, setClusters] = useState<StoryClusterItem[]>(initialClusters);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClusteringRunning, setIsClusteringRunning] = useState(false);
  const [synthesizingClusterId, setSynthesizingClusterId] = useState<string | null>(null);
  const [inspectingCluster, setInspectingCluster] = useState<StoryClusterItem | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleRunClustering = async () => {
    setIsClusteringRunning(true);
    setErrorToast(null);
    try {
      const res = await fetch('/api/admin/clusters/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to run clustering');
      router.refresh();
      // Reload clusters
      const reload = await fetch('/api/admin/clusters');
      const reloadData = await reload.json();
      if (reloadData.clusters) setClusters(reloadData.clusters);
    } catch (err: unknown) {
      setErrorToast(err instanceof Error ? err.message : 'Error triggering clustering');
    } finally {
      setIsClusteringRunning(false);
    }
  };

  const handleSynthesizeArticle = async (clusterId: string) => {
    setSynthesizingClusterId(clusterId);
    setErrorToast(null);
    try {
      const res = await fetch(`/api/admin/clusters/${clusterId}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'Editorial Desk' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to synthesize draft');
      router.push(`/admin/drafts/${data.draftId}`);
    } catch (err: unknown) {
      setErrorToast(err instanceof Error ? err.message : 'Error generating synthesized draft');
      setSynthesizingClusterId(null);
    }
  };

  const filteredClusters = clusters.filter((c) => {
    if (selectedCategory !== 'ALL' && c.categorySlug !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.summary && c.summary.toLowerCase().includes(q)) ||
        c.sources.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Story Clusters</h1>
          <p>
            Multi-source intelligence grouping stories from Reuters, BBC, TechCrunch, and other wires into single high-impact events.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryBtn}
            onClick={handleRunClustering}
            disabled={isClusteringRunning}
          >
            <RefreshCw size={16} className={isClusteringRunning ? 'animate-spin' : ''} />
            {isClusteringRunning ? 'Clustering Wires...' : 'Run Clustering'}
          </button>
        </div>
      </div>

      {errorToast && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.875rem' }}>
          {errorToast}
        </div>
      )}

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search story clusters or sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.selectInput}
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={styles.selectInput}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active (Multiple Sources)</option>
          <option value="PENDING">Pending (Single Source)</option>
          <option value="DRAFTED">Drafted</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      {/* Clusters List */}
      <div className={styles.clusterList}>
        {filteredClusters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 8, color: '#64748b' }}>
            No clusters match your filters. Click <strong>Run Clustering</strong> to cluster incoming news.
          </div>
        ) : (
          filteredClusters.map((cluster) => {
            const isSynthesizing = synthesizingClusterId === cluster.id;
            return (
              <div key={cluster.id} className={styles.clusterCard}>
                <div className={styles.cardTop}>
                  <div className={styles.badges}>
                    <span className={styles.categoryBadge}>{cluster.category}</span>
                    <span className={styles.sourceCountPill}>
                      <Layers size={13} />
                      {cluster.sourceCount} {cluster.sourceCount === 1 ? 'source' : 'sources reporting'}
                    </span>
                    {cluster.isBreaking && (
                      <span className={styles.breakingBadge}>BREAKING</span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Importance: <strong>{cluster.importanceScore}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Updated {new Date(cluster.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardContent}>
                    <h2 className={styles.clusterTitle}>{cluster.title}</h2>
                    {cluster.summary && (
                      <p className={styles.clusterSummary}>{cluster.summary}</p>
                    )}
                    <div className={styles.sourcesList}>
                      <span className={styles.sourcesLabel}>Sources:</span>
                      {cluster.sources.map((src, idx) => (
                        <span key={idx} className={styles.sourceChip}>{src}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {cluster.draft ? (
                      <Link href={`/admin/drafts/${cluster.draft.id}`} className={styles.draftLink}>
                        View Draft ({cluster.draft.status}) →
                      </Link>
                    ) : (
                      <button
                        className={styles.synthesizeBtn}
                        onClick={() => handleSynthesizeArticle(cluster.id)}
                        disabled={isSynthesizing}
                      >
                        <Sparkles size={15} />
                        {isSynthesizing ? 'Synthesizing...' : 'Synthesize Article'}
                      </button>
                    )}
                    <button
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8125rem', cursor: 'pointer', padding: '0.25rem' }}
                      onClick={() => setInspectingCluster(cluster)}
                    >
                      Inspect Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {inspectingCluster && (
        <div className={styles.modalOverlay} onClick={() => setInspectingCluster(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Cluster Inspection</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  Cluster ID: #{inspectingCluster.id.slice(0, 8)} · {inspectingCluster.sourceCount} sources
                </p>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setInspectingCluster(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{inspectingCluster.title}</h4>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                  {inspectingCluster.summary}
                </p>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <h5 style={{ margin: '0 0 0.5rem', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Contributing Reporting Sources ({inspectingCluster.sources.length}):
                </h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {inspectingCluster.sources.map((src, i) => (
                    <span key={i} className={styles.sourceChip}>
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setInspectingCluster(null)}
              >
                Close
              </button>
              {!inspectingCluster.draft && (
                <button
                  className={styles.primaryBtn}
                  onClick={() => handleSynthesizeArticle(inspectingCluster.id)}
                >
                  <Sparkles size={15} />
                  Synthesize Multi-Source Article
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
