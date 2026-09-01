import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryBySlug, categories } from '@/lib/mock-data';
import { getPublishedArticlesByCategory } from '@/lib/articles';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import AdSlot from '@/components/shared/AdSlot';
import styles from './category.module.css';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url: `/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryArticles = await getPublishedArticlesByCategory(slug);
  if (!categoryArticles.length) notFound();

  const [featured, ...rest] = categoryArticles;
  const featuredUrl = `/${featured.category.slug}/${featured.slug}`;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.categoryTitle}>{category.name}</h1>
          <p className={styles.categoryDesc}>{category.description}</p>
        </div>

        {/* Featured */}
        <article className={styles.featured}>
          <Link href={featuredUrl} className={styles.featuredImageWrapper} tabIndex={-1} aria-hidden="true">
            <Image
              src={featured.featuredImage}
              alt={featured.imageAlt}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 60vw"
              style={{ objectFit: 'cover' }}
            />
          </Link>
          <div className={styles.featuredContent}>
            <Link href={`/${featured.category.slug}`} className="category-tag">
              {featured.category.name}
            </Link>
            <h2 className={styles.featuredHeadline}>
              <Link href={featuredUrl}>{featured.title}</Link>
            </h2>
            <p className={styles.featuredDesc}>{featured.description}</p>
            <div className={styles.featuredMeta}>
              <span>{featured.author.name}</span>
              <span>·</span>
              <time dateTime={featured.publishedAt}>{formatRelativeTime(featured.publishedAt)}</time>
              <span>·</span>
              <span>{formatReadingTime(featured.readingTime)}</span>
            </div>
          </div>
        </article>

        {/* Ad */}
        <div style={{ padding: '1.5rem 0' }}>
          <AdSlot id={`ad-category-${slug}`} width={728} height={90} />
        </div>

        {/* Article Grid */}
        <section aria-label={`All ${category.name} articles`}>
          <h2 className="section-heading">Latest in {category.name}</h2>
          <div className={styles.grid}>
            {rest.map((article) => {
              const url = `/${article.category.slug}/${article.slug}`;
              return (
                <article key={article.id} className={styles.card}>
                  <Link href={url} className={styles.cardImageWrapper} tabIndex={-1} aria-hidden="true">
                    <Image
                      src={article.featuredImage}
                      alt={article.imageAlt}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </Link>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardHeadline}>
                      <Link href={url}>{article.title}</Link>
                    </h3>
                    <p className={styles.cardDesc}>{article.description}</p>
                    <div className={styles.cardMeta}>
                      <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                      <span>·</span>
                      <span>{formatReadingTime(article.readingTime)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
