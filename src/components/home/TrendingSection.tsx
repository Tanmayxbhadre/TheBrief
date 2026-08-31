import Link from 'next/link';
import { Article } from '@/lib/types';
import styles from './TrendingSection.module.css';

interface TrendingSectionProps {
  articles: Article[];
}

export default function TrendingSection({ articles }: TrendingSectionProps) {
  return (
    <section className={styles.section} aria-label="Trending stories">
      <h2 className="section-heading">Trending Now</h2>

      <ol className={styles.list}>
        {articles.slice(0, 5).map((article, i) => {
          const url = `/${article.category.slug}/${article.slug}`;
          const num = String(i + 1).padStart(2, '0');

          return (
            <li key={article.id} className={styles.item}>
              <span className={styles.number} aria-hidden="true">{num}</span>
              <div className={styles.content}>
                <Link href={`/${article.category.slug}`} className="category-tag">
                  {article.category.name}
                </Link>
                <h3 className={styles.headline}>
                  <Link href={url}>{article.title}</Link>
                </h3>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
