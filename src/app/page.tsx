import type { Metadata } from 'next';
import BreakingNewsBar from '@/components/layout/BreakingNewsBar';
import HeroSection from '@/components/home/HeroSection';
import LatestNewsFeed from '@/components/home/LatestNewsFeed';
import CategorySection from '@/components/home/CategorySection';
import TrendingSection from '@/components/home/TrendingSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import LiveNewsRefresher from '@/components/home/LiveNewsRefresher';
import AdSlot from '@/components/shared/AdSlot';

import { getHomepageData } from '@/lib/news/homepage';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'THE BRIEF — Serious Journalism for the Modern Reader',
  description:
    "India's most trusted source for clear, concise news across Technology, AI, Business, India, World, and Science.",
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const {
    breakingItem,
    featured,
    secondary,
    latestArticles,
    trendingArticles,
    categoryArticles,
    latestPublishedAt,
    latestArticleId,
  } = await getHomepageData();

  const techArticles = categoryArticles['technology'] || [];
  const indiaArticles = categoryArticles['india'] || [];
  const worldArticles = categoryArticles['world'] || [];
  const aiArticles = categoryArticles['ai'] || [];
  const businessArticles = categoryArticles['business'] || [];
  const scienceArticles = categoryArticles['science'] || [];
  const startupsArticles = categoryArticles['startups'] || [];
  const gamingArticles = categoryArticles['gaming'] || [];
  const entertainmentArticles = categoryArticles['entertainment'] || [];

  return (
    <>
      {/* Client-Side Live News Refresher (Checks for new publications every 60s & on tab focus) */}
      <LiveNewsRefresher
        initialLatestPublishedAt={latestPublishedAt}
        initialLatestArticleId={latestArticleId}
      />

      {/* Dynamic Breaking News Bar */}
      {breakingItem && <BreakingNewsBar item={breakingItem} />}

      {/* Hero Section */}
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

        {worldArticles.length > 0 && (
          <CategorySection
            categoryName="World"
            categorySlug="world"
            articles={worldArticles}
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

        {startupsArticles.length > 0 && (
          <CategorySection
            categoryName="Startups & Venture"
            categorySlug="startups"
            articles={startupsArticles}
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
