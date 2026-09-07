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
                    <span className={styles.sourcesCount}>
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
                      <Link href={item.url} className={styles.missedLink}>
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
            <div className={styles.roundupGrid}>
              {Object.entries(content.categoryRoundup).map(([catSlug, items]) => (
                <div key={catSlug} className={styles.roundupCard}>
                  <h3 className={styles.roundupCatLabel}>
                    {catSlug}
                  </h3>
                  <div className={styles.roundupItemList}>
                    {items.map((item) => (
                      <div key={item.id}>
                        <Link href={item.url} className={styles.roundupLink}>
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
