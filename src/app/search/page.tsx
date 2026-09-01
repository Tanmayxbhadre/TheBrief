'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { searchArticles } from '@/lib/mock-data';
import { formatRelativeTime, formatReadingTime } from '@/lib/utils';
import styles from './search.module.css';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);

  const results = useMemo(() => {
    return query ? searchArticles(query) : [];
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Search Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Search</h1>

          <form onSubmit={handleSearch} className={styles.form} role="search">
            <label htmlFor="search-input" className="sr-only">Search news</label>
            <div className={styles.inputWrapper}>
              <SearchIcon size={18} strokeWidth={1.75} className={styles.searchIcon} aria-hidden="true" />
              <input
                id="search-input"
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search news, topics, categories…"
                className={styles.input}
                autoFocus
              />
            </div>
            <button type="submit" className={styles.btn}>Search</button>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div className={styles.results}>
            <p className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>

            {results.length === 0 ? (
              <div className={styles.empty}>
                <p>No articles found. Try a different search term.</p>
              </div>
            ) : (
              <div className={styles.list}>
                {results.map((article) => {
                  const url = `/${article.category.slug}/${article.slug}`;
                  return (
                    <article key={article.id} className={styles.resultItem}>
                      <Link href={`/${article.category.slug}`} className="category-tag">
                        {article.category.name}
                      </Link>
                      <h2 className={styles.resultHeadline}>
                        <Link href={url}>{article.title}</Link>
                      </h2>
                      <p className={styles.resultDesc}>{article.description}</p>
                      <div className={styles.resultMeta}>
                        <span>{article.author.name}</span>
                        <span>·</span>
                        <time dateTime={article.publishedAt}>{formatRelativeTime(article.publishedAt)}</time>
                        <span>·</span>
                        <span>{formatReadingTime(article.readingTime)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className={styles.empty}>
            <p>Enter a search term to find articles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '5rem 0', color: 'var(--color-text-muted)' }}>Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
