import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestArticles, getArticlesByCategory, categories } from '@/lib/mock-data';
import { formatDate, formatTime, formatReadingTime } from '@/lib/utils';
import styles from './daily-news.module.css';

export const metadata: Metadata = {
  title: 'Daily News — Today\'s Top Stories',
  description: 'Your complete daily news digest. All the important stories across India, World, Technology, AI, Business, and Science — in one place.',
  alternates: { canonical: '/daily-news' },
};

export default function DailyNewsPage() {
  const today = new Date().toISOString();
  const allArticles = getLatestArticles(20);

  const categoryGroups = categories
    .map((cat) => ({
      category: cat,
      articles: getArticlesByCategory(cat.slug, 3),
    }))
    .filter((g) => g.articles.length > 0);

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>Today&apos;s News</h1>
            <time dateTime={today} className={styles.date}>{formatDate(today)}</time>
          </div>
          <div className={styles.dateNav}>
            <Link href="/daily-news" className={styles.dateNavLink}>Today</Link>
          </div>
        </div>

        {/* Top Stories */}
        <section className={styles.section} aria-label="Top stories today">
          <h2 className="section-heading">Top Stories</h2>
          <div className={styles.topStories}>
            {allArticles.slice(0, 5).map((article) => {
              const url = `/${article.category.slug}/${article.slug}`;
              return (
                <article key={article.id} className={styles.topStory}>
                  <div className={styles.storyTime}>
                    <time dateTime={article.publishedAt} className={styles.time}>
                      {formatTime(article.publishedAt)}
                    </time>
                  </div>
                  <div className={styles.storyContent}>
                    <Link href={`/${article.category.slug}`} className="category-tag">
                      {article.category.name}
                    </Link>
                    <h3 className={styles.storyHeadline}>
                      <Link href={url}>{article.title}</Link>
                    </h3>
                    <p className={styles.storyDesc}>{article.description}</p>
                    <div className={styles.storyMeta}>
                      <span>{article.author.name}</span>
                      <span>·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* By Category */}
        {categoryGroups.map(({ category, articles: catArticles }) => (
          <section key={category.id} className={styles.section} aria-label={`${category.name} news today`}>
            <h2 className="section-heading">
              <span>{category.name}</span>
              <Link href={`/${category.slug}`}>View all →</Link>
            </h2>
            <div className={styles.categoryGrid}>
              {catArticles.map((article) => {
                const url = `/${article.category.slug}/${article.slug}`;
                return (
                  <article key={article.id} className={styles.categoryItem}>
                    <h3 className={styles.categoryHeadline}>
                      <Link href={url}>{article.title}</Link>
                    </h3>
                    <div className={styles.categoryMeta}>
                      <time dateTime={article.publishedAt}>{formatTime(article.publishedAt)}</time>
                      <span>·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}
