import type { Metadata } from 'next';
import BreakingNewsBar from '@/components/layout/BreakingNewsBar';
import HeroSection from '@/components/home/HeroSection';
import LatestNewsFeed from '@/components/home/LatestNewsFeed';
import CategorySection from '@/components/home/CategorySection';
import TrendingSection from '@/components/home/TrendingSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import AdSlot from '@/components/shared/AdSlot';
import {
  getBreakingNews,
  articles,
} from '@/lib/mock-data';
import {
  getAllPublishedArticles,
  getLatestPublishedArticles,
  getPublishedArticlesByCategory,
} from '@/lib/articles';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'THE BRIEF — Serious Journalism for the Modern Reader',
  description:
    "India's most trusted source for clear, concise news across Technology, AI, Business, India, World, and Science.",
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const allArticles = await getAllPublishedArticles();
  const featured = allArticles.find((a) => a.featured) || allArticles[0];
  const secondary = allArticles.filter((a) => a.id !== featured.id && a.featured).slice(0, 3);
  const latestArticles = await getLatestPublishedArticles(8);
  const trendingArticles = allArticles.slice(0, 5);
  const breakingItem = getBreakingNews();

  const techArticles = await getPublishedArticlesByCategory('technology', 4);
  const indiaArticles = await getPublishedArticlesByCategory('india', 4);
  const aiArticles = await getPublishedArticlesByCategory('ai', 4);
  const businessArticles = await getPublishedArticlesByCategory('business', 4);
  const scienceArticles = await getPublishedArticlesByCategory('science', 4);
  const gamingArticles = await getPublishedArticlesByCategory('gaming', 4);
  const entertainmentArticles = await getPublishedArticlesByCategory('entertainment', 4);

  return (
    <>
      {/* Breaking News Bar */}
      {breakingItem && <BreakingNewsBar item={breakingItem} />}

      {/* Hero */}
      <section aria-label="Today's top stories">
        <HeroSection featured={featured} secondary={secondary} />
      </section>

      {/* Ad slot — after hero */}
      <div className="container">
        <div className={styles.adRow}>
          <AdSlot id="ad-post-hero" width={728} height={90} />
        </div>
      </div>

      {/* Latest + Trending side by side */}
      <div className="container">
        <div className={styles.latestTrendingGrid}>
          <LatestNewsFeed articles={latestArticles} />
          <TrendingSection articles={trendingArticles} />
        </div>
      </div>

      {/* Category Sections */}
      <div className={`container ${styles.categorySections}`}>
        {techArticles.length > 0 && (
          <CategorySection
            categoryName="Technology"
            categorySlug="technology"
            articles={techArticles}
          />
        )}

        {/* Mid-page ad */}
        <div className={styles.adRow}>
          <AdSlot id="ad-mid-page" width={970} height={90} />
        </div>

        {indiaArticles.length > 0 && (
          <CategorySection
            categoryName="India"
            categorySlug="india"
            articles={indiaArticles}
          />
        )}

        {aiArticles.length > 0 && (
          <CategorySection
            categoryName="Artificial Intelligence"
            categorySlug="ai"
            articles={aiArticles}
          />
        )}

        {businessArticles.length > 0 && (
          <CategorySection
            categoryName="Business"
            categorySlug="business"
            articles={businessArticles}
          />
        )}

        {scienceArticles.length > 0 && (
          <CategorySection
            categoryName="Science"
            categorySlug="science"
            articles={scienceArticles}
          />
        )}

        {gamingArticles.length > 0 && (
          <CategorySection
            categoryName="Gaming"
            categorySlug="gaming"
            articles={gamingArticles}
          />
        )}

        {entertainmentArticles.length > 0 && (
          <CategorySection
            categoryName="Entertainment"
            categorySlug="entertainment"
            articles={entertainmentArticles}
          />
        )}
      </div>

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  );
}
