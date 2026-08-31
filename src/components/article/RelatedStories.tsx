import Image from 'next/image';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import styles from './RelatedStories.module.css';

interface RelatedStoriesProps {
  articles: Article[];
}

export default function RelatedStories({ articles }: RelatedStoriesProps) {
  if (!articles.length) return null;

  return (
    <section className={styles.section} aria-label="Related stories">
      <h2 className="section-heading">Related Stories</h2>

      <div className={styles.grid}>
        {articles.slice(0, 4).map((article) => {
          const url = `/${article.category.slug}/${article.slug}`;
          return (
            <article key={article.id} className={styles.card}>
              <Link href={url} className={styles.imageWrapper} tabIndex={-1} aria-hidden="true">
                <Image
                  src={article.featuredImage}
                  alt={article.imageAlt}
                  fill
                  sizes="(max-width: 767px) 100vw, 25vw"
                  className={styles.image}
                  loading="lazy"
                />
              </Link>
              <div className={styles.content}>
                <Link href={`/${article.category.slug}`} className="category-tag">
                  {article.category.name}
                </Link>
                <h3 className={styles.headline}>
                  <Link href={url}>{article.title}</Link>
                </h3>
                <div className={styles.meta}>
                  <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{formatReadingTime(article.readingTime)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
