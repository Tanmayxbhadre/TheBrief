import Image from 'next/image';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import styles from './NewsCard.module.css';

interface NewsCardProps {
  article: Article;
  variant?: 'default' | 'horizontal' | 'minimal' | 'large';
  showDescription?: boolean;
  showAuthor?: boolean;
}

export default function NewsCard({
  article,
  variant = 'default',
  showDescription = true,
  showAuthor = true,
}: NewsCardProps) {
  const articleUrl = `/${article.category.slug}/${article.slug}`;

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      {/* Image */}
      <Link href={articleUrl} className={styles.imageWrapper} tabIndex={-1} aria-hidden="true">
        <Image
          src={article.featuredImage}
          alt={article.imageAlt}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className={styles.image}
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div className={styles.content}>
        <Link href={`/${article.category.slug}`} className="category-tag">
          {article.category.name}
        </Link>

        <h2 className={styles.headline}>
          <Link href={articleUrl} className={styles.headlineLink}>
            {article.title}
          </Link>
        </h2>

        {showDescription && (
          <p className={styles.description}>{article.description}</p>
        )}

        <div className={styles.meta}>
          {showAuthor && (
            <span className={styles.author}>{article.author.name}</span>
          )}
          {showAuthor && <span className={styles.dot} aria-hidden="true">·</span>}
          <time dateTime={article.publishedAt} className={styles.time}>
            {formatRelativeTime(article.publishedAt)}
          </time>
          <span className={styles.dot} aria-hidden="true">·</span>
          <span className={styles.readTime}>{formatReadingTime(article.readingTime)}</span>
        </div>
      </div>
    </article>
  );
}
