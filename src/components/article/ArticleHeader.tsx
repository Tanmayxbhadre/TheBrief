import Image from 'next/image';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate, formatReadingTime } from '@/lib/utils';
import Breadcrumbs from './Breadcrumbs';
import styles from './ArticleHeader.module.css';

interface ArticleHeaderProps {
  article: Article;
}

export default function ArticleHeader({ article }: ArticleHeaderProps) {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: article.category.name, href: `/${article.category.slug}` },
    { label: article.title },
  ];

  return (
    <header className={styles.header}>
      <div className="article-container">
        <Breadcrumbs items={breadcrumbs} />

        <Link href={`/${article.category.slug}`} className={`category-tag ${styles.category}`}>
          {article.category.name}
        </Link>

        <h1 className={styles.headline}>{article.title}</h1>

        <p className={styles.description}>{article.description}</p>

        {/* Byline */}
        <div className={styles.byline}>
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{article.author.name}</span>
          </div>
          <div className={styles.metaInfo}>
            <time dateTime={article.publishedAt} className={styles.date}>
              {formatDate(article.publishedAt)}
            </time>
            {article.updatedAt && article.updatedAt !== article.publishedAt && (
              <span className={styles.updated}>
                Updated {formatDate(article.updatedAt)}
              </span>
            )}
            <span className={styles.metaDot} aria-hidden="true">·</span>
            <span className={styles.readTime}>{formatReadingTime(article.readingTime)}</span>
          </div>
        </div>
      </div>

      {/* Hero image — full width */}
      <div className={styles.heroImageWrapper}>
        <Image
          src={article.featuredImage}
          alt={article.imageAlt}
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
      </div>
      <div className="article-container">
        <p className={styles.imageCaption}>{article.imageAlt}</p>
      </div>
    </header>
  );
}
