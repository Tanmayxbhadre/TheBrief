import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestDailyBriefing } from '@/lib/news/dailyBriefService';
import { formatDate } from '@/lib/utils';
import styles from './daily-news.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Daily Brief — Your 5-Minute News Briefing',
  description:
    'Synthesized, authoritative morning and evening intelligence briefing. Key developments across Technology, AI, India, Business, Science, and World — in 5 minutes.',
  alternates: { canonical: '/daily-news' },
};

interface Props {
  searchParams: Promise<{ edition?: string }>;
}

export default async function DailyNewsPage({ searchParams }: Props) {
  const { edition = 'morning' } = await searchParams;
  const currentEdition = edition === 'evening' ? 'evening' : 'morning';

  const { briefing, content } = await getLatestDailyBriefing(currentEdition);
  const formattedDate = formatDate(briefing.date);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Flagship Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>The Daily Brief</h1>
            <p className={styles.briefSubheading}>
              Your 5-minute executive briefing · {formattedDate}
            </p>
          </div>
          <div className={styles.dateNav}>
            <div className={styles.editionSwitcher} role="tablist" aria-label="Briefing Edition">
              <Link
                href="/daily-news?edition=morning"
                className={`${styles.editionBtn} ${currentEdition === 'morning' ? styles.editionBtnActive : ''}`}
              >
                Morning Brief
              </Link>
              <Link
                href="/daily-news?edition=evening"
                className={`${styles.editionBtn} ${currentEdition === 'evening' ? styles.editionBtnActive : ''}`}
              >
                Evening Brief
              </Link>
            </div>
          </div>
        </div>

        {/* 1. TOP STORIES */}
        <section className={styles.section} aria-label="Top Stories Today">
          <h2 className="section-heading">Top Stories</h2>
          <div className={styles.topStories}>
            {content.topStories.map((story) => (
              <article key={story.id} className={styles.topStory}>
                <div className={styles.storyTime}>
                  <span className="category-tag">{story.category}</span>
                </div>
                <div className={styles.storyContent}>
                  <h3 className={styles.storyHeadline}>
                    <Link href={story.url}>{story.title}</Link>
                  </h3>
                  <p className={styles.storyDesc}>{story.excerpt}</p>
                  {story.sourcesCount && story.sourcesCount > 1 && (
                    <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                      ⚡ Cross-verified across {story.sourcesCount} sources
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 2. WHAT YOU MISSED */}
        {content.whatYouMissed && content.whatYouMissed.length > 0 && (
          <section className={styles.section} aria-label="What You Missed">
            <h2 className="section-heading">What You Missed</h2>
            <div className={styles.missedBox}>
              <ul className={styles.missedList}>
                {content.whatYouMissed.map((item) => (
                  <li key={item.id} className={styles.missedItem}>
                    <span className={styles.missedBullet}>•</span>
                    <div>
                      <strong>{item.category}:</strong>{' '}
                      <Link href={item.url} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {item.summaryPoint}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 3. SECTOR ROUNDUP */}
        {Object.keys(content.categoryRoundup).length > 0 && (
          <section className={styles.section} aria-label="Sector Rundowns">
            <h2 className="section-heading">Sector Rundowns</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {Object.entries(content.categoryRoundup).map(([catSlug, items]) => (
                <div
                  key={catSlug}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-accent, #0284c7)',
                      letterSpacing: '0.04em',
                      margin: '0 0 0.75rem',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '0.5rem',
                    }}
                  >
                    {catSlug}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map((item) => (
                      <div key={item.id}>
                        <Link
                          href={item.url}
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            color: 'var(--color-text)',
                            textDecoration: 'none',
                            lineHeight: 1.4,
                            display: 'block',
                            marginBottom: '2px',
                          }}
                        >
                          {item.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. WHAT TO WATCH */}
        {content.whatToWatch && content.whatToWatch.length > 0 && (
          <section className={styles.section} aria-label="What To Watch">
            <h2 className="section-heading">What To Watch</h2>
            <div className={styles.watchBox}>
              <ul className={styles.watchList}>
                {content.whatToWatch.map((note, idx) => (
                  <li key={idx}>
                    <strong>→</strong> {note}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
