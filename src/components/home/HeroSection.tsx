import Image from 'next/image';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate, formatReadingTime } from '@/lib/utils';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  featured: Article;
  secondary: Article[];
}

export default function HeroSection({ featured, secondary }: HeroSectionProps) {
  const featuredUrl = `/${featured.category.slug}/${featured.slug}`;

  return (
    <section className={styles.hero} aria-label="Featured stories">
      <div className={styles.grid}>

        {/* Main featured story */}
        <article className={styles.main}>
          <Link href={featuredUrl} className={styles.mainImageWrapper} aria-hidden="true" tabIndex={-1}>
            <Image
              src={featured.featuredImage}
              alt={featured.imageAlt}
              fill
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 65vw"
              className={styles.mainImage}
            />
          </Link>
          <div className={styles.mainContent}>
            <Link href={`/${featured.category.slug}`} className={`category-tag ${styles.categoryTag}`}>
              {featured.category.name}
            </Link>
            <h1 className={styles.mainHeadline}>
              <Link href={featuredUrl}>{featured.title}</Link>
            </h1>
            <p className={styles.mainDescription}>{featured.description}</p>
            <div className={styles.mainMeta}>
              <span className={styles.author}>{featured.author.name}</span>
              <span className={styles.metaDot} aria-hidden="true">·</span>
              <time dateTime={featured.publishedAt}>
                {formatDate(featured.publishedAt)}
              </time>
              <span className={styles.metaDot} aria-hidden="true">·</span>
              <span>{formatReadingTime(featured.readingTime)}</span>
            </div>
            <Link href={featuredUrl} className={styles.readLink} aria-label={`Read full story: ${featured.title}`}>
              Read story →
            </Link>
          </div>
        </article>

        {/* Secondary stories */}
        <aside className={styles.sidebar} aria-label="More top stories">
          {secondary.slice(0, 3).map((article, i) => {
            const url = `/${article.category.slug}/${article.slug}`;
            return (
              <article key={article.id} className={styles.secondary}>
                {i > 0 && <div className={styles.separator} aria-hidden="true" />}
                <div className={styles.secondaryInner}>
                  <div className={styles.secondaryText}>
                    <Link href={`/${article.category.slug}`} className="category-tag">
                      {article.category.name}
                    </Link>
                    <h2 className={styles.secondaryHeadline}>
                      <Link href={url}>{article.title}</Link>
                    </h2>
                    <div className={styles.secondaryMeta}>
                      <time dateTime={article.publishedAt}>
                        {formatDate(article.publishedAt)}
                      </time>
                      <span className={styles.metaDot} aria-hidden="true">·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </div>
                  <Link href={url} className={styles.secondaryImageWrapper} tabIndex={-1} aria-hidden="true">
                    <Image
                      src={article.featuredImage}
                      alt={article.imageAlt}
                      fill
                      sizes="120px"
                      className={styles.secondaryImage}
                      loading="lazy"
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </aside>

      </div>
    </section>
  );
}
