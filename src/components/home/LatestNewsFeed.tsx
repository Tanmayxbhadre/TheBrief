import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatTime, formatDate } from '@/lib/utils';
import styles from './LatestNewsFeed.module.css';

interface LatestNewsFeedProps {
  articles: Article[];
}

export default function LatestNewsFeed({ articles }: LatestNewsFeedProps) {
  return (
    <section className={styles.section} aria-label="Latest news">
      <div className={styles.header}>
        <h2 className="section-heading">
          <span>Latest News</span>
          <Link href="/daily-news">See all →</Link>
        </h2>
      </div>

      <ol className={styles.feed} aria-label="Latest news articles in chronological order">
        {articles.map((article, i) => {
          const url = `/${article.category.slug}/${article.slug}`;
          return (
            <li key={article.id} className={styles.item}>
              <div className={styles.timeCol}>
                <time dateTime={article.publishedAt} className={styles.time}>
                  {formatTime(article.publishedAt)}
                </time>
              </div>
              <div className={styles.contentCol}>
                <Link href={`/${article.category.slug}`} className={`category-tag ${styles.cat}`}>
                  {article.category.name}
                </Link>
                <h3 className={styles.headline}>
                  <Link href={url}>{article.title}</Link>
                </h3>
                <p className={styles.description}>{article.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
