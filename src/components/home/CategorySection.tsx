import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/types';
import { formatDate, formatReadingTime } from '@/lib/utils';
import styles from './CategorySection.module.css';

interface CategorySectionProps {
  categoryName: string;
  categorySlug: string;
  articles: Article[];
}

export default function CategorySection({ categoryName, categorySlug, articles }: CategorySectionProps) {
  if (!articles.length) return null;

  const [primary, ...rest] = articles;
  const primaryUrl = `/${primary.category.slug}/${primary.slug}`;

  return (
    <section className={styles.section} aria-label={`${categoryName} news`}>
      <h2 className="section-heading">
        <span>{categoryName}</span>
        <Link href={`/${categorySlug}`}>View all →</Link>
      </h2>

      <div className={styles.grid}>
        {/* Primary story */}
        <article className={styles.primary}>
          <Link href={primaryUrl} className={styles.imageWrapper} tabIndex={-1} aria-hidden="true">
            <Image
              src={primary.featuredImage}
              alt={primary.imageAlt}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 40vw"
              className={styles.image}
              loading="lazy"
            />
          </Link>
          <div className={styles.primaryContent}>
            <Link href={`/${primary.category.slug}`} className="category-tag">
              {primary.category.name}
            </Link>
            <h3 className={styles.primaryHeadline}>
              <Link href={primaryUrl}>{primary.title}</Link>
            </h3>
            <p className={styles.primaryDesc}>{primary.description}</p>
            <div className={styles.primaryMeta}>
              <time dateTime={primary.publishedAt}>{formatDate(primary.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{formatReadingTime(primary.readingTime)}</span>
            </div>
          </div>
        </article>

        {/* Secondary stories with thumbnails */}
        <div className={styles.secondaryList}>
          {rest.slice(0, 3).map((article, i) => {
            const url = `/${article.category.slug}/${article.slug}`;
            return (
              <article key={article.id} className={styles.secondary}>
                {i > 0 && <div className={styles.sep} aria-hidden="true" />}
                <div className={styles.secondaryInner}>
                  <div className={styles.secondaryText}>
                    <h3 className={styles.secondaryHeadline}>
                      <Link href={url}>{article.title}</Link>
                    </h3>
                    <div className={styles.secondaryMeta}>
                      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </div>
                  <Link href={url} className={styles.secondaryImageWrapper} tabIndex={-1} aria-hidden="true">
                    <Image
                      src={article.featuredImage}
                      alt={article.imageAlt}
                      fill
                      sizes="80px"
                      className={styles.secondaryImage}
                      loading="lazy"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
