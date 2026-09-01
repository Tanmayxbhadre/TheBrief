import React from 'react';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { aiService } from '@/lib/ai/service';
import { Shield, Server, Radio, Database, CheckCircle2, Lock, Sparkles, Cpu } from 'lucide-react';
import styles from './settings.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  const aiInfo = aiService.getProviderInfo();
  const aiEnabled = aiService.isEnabled();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    sourcesCount,
    newsCount,
    draftsCount,
    publishedCount,
    aiTodayCount,
    aiMonthCount,
    aiTotalCount,
    aiTokenAggregate,
  ] = await Promise.all([
    prisma.source.count(),
    prisma.newsItem.count(),
    prisma.articleDraft.count(),
    prisma.articleDraft.count({ where: { status: 'PUBLISHED' } }),
    prisma.aIGenerationLog.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.aIGenerationLog.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.aIGenerationLog.count(),
    prisma.aIGenerationLog.aggregate({
      _sum: {
        totalTokens: true,
      },
    }),
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>System & Editorial Settings</h1>
        <p className={styles.subtitle}>
          Configuration, security posture, AI provider parameters, database metrics, and editorial rules for TheBrief.
        </p>
      </div>

      <div className={styles.grid}>
        {/* AI Assisted Drafting Configuration */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Sparkles size={18} color="#2563eb" />
            <h2 className={styles.cardTitle}>AI Drafting Engine & Cost Tracking</h2>
          </div>
          <div className={styles.body}>
            <div className={styles.item}>
              <span className={styles.label}>Active AI Provider</span>
              <span className={styles.val} style={{ textTransform: 'capitalize' }}>
                {aiInfo.provider} {aiInfo.isMock && '(Local Development Mock)'}
              </span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Configured Model</span>
              <span className={styles.val}>{aiInfo.model}</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>AI Drafting Status</span>
              <span
                className={styles.valBadge}
                style={{
                  backgroundColor: aiEnabled ? '#dcfce7' : '#fee2e2',
                  color: aiEnabled ? '#166534' : '#991b1b',
                }}
              >
                {aiEnabled ? 'Active & Enabled' : 'Disabled (AI_ENABLED=false)'}
              </span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Server Key Isolation</span>
              <span className={styles.valBadge}>Zero Client Exposure (Protected Server Actions)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Generations Today</span>
              <span className={styles.val}>{aiTodayCount} operations</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Generations This Month</span>
              <span className={styles.val}>{aiMonthCount} operations ({aiTotalCount} all-time)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Total AI Tokens Tracked</span>
              <span className={styles.val}>{(aiTokenAggregate._sum.totalTokens || 0).toLocaleString()} tokens</span>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={18} color="var(--color-accent, #1a3a8b)" />
            <h2 className={styles.cardTitle}>Admin Security & Authentication</h2>
          </div>
          <div className={styles.body}>
            <div className={styles.item}>
              <span className={styles.label}>Active Session User</span>
              <span className={styles.val}>{session.user || 'Admin Editor'}</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Session Security</span>
              <span className={styles.valBadge}>HMAC-SHA256 Signed HTTP-Only Cookie</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Route Protection</span>
              <span className={styles.valBadge}>Server-Side Middleware (/admin/* & /api/admin/*)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Environment Secret</span>
              <span className={styles.val}>ADMIN_SECRET Active</span>
            </div>
          </div>
        </div>

        {/* Editorial Workflow Policies */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Lock size={18} color="var(--color-accent, #1a3a8b)" />
            <h2 className={styles.cardTitle}>Editorial Workflow Policies</h2>
          </div>
          <div className={styles.body}>
            <div className={styles.item}>
              <span className={styles.label}>Publishing Mode</span>
              <span className={styles.valBadge}>Human/Editor Approval Required (Zero Auto-Publish)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Source Attribution</span>
              <span className={styles.valBadge}>Enforced Checklist Prior to Publishing</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Draft Isolation</span>
              <span className={styles.val}>Original Wire Records Preserved (No Overwriting)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Draft SEO Indexing</span>
              <span className={styles.val}>noindex / Protected Preview</span>
            </div>
          </div>
        </div>

        {/* Database & Pipeline Metrics */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Database size={18} color="var(--color-accent, #1a3a8b)" />
            <h2 className={styles.cardTitle}>Database & Ingestion Engine</h2>
          </div>
          <div className={styles.body}>
            <div className={styles.item}>
              <span className={styles.label}>Database Driver</span>
              <span className={styles.val}>SQLite (Prisma ORM Client)</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Registered Sources</span>
              <span className={styles.val}>{sourcesCount} feeds</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Collected News Items</span>
              <span className={styles.val}>{newsCount} wire records</span>
            </div>
            <div className={styles.item}>
              <span className={styles.label}>Article Drafts</span>
              <span className={styles.val}>{draftsCount} total ({publishedCount} published live)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
