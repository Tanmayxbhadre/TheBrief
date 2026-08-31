import type { Metadata } from 'next';
import BreakingNewsBar from '@/components/layout/BreakingNewsBar';
import HeroSection from '@/components/home/HeroSection';
import LatestNewsFeed from '@/components/home/LatestNewsFeed';
import CategorySection from '@/components/home/CategorySection';
import TrendingSection from '@/components/home/TrendingSection';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import AdSlot from '@/components/shared/AdSlot';
import {
  getFeaturedArticle,
  getLatestArticles,
  getTrendingArticles,
  getArticlesByCategory,
  getBreakingNews,
  articles,
} from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'THE BRIEF — Serious Journalism for the Modern Reader',
  description:
    'India\'s most trusted source for clear, concise news across Technology, AI, Business, India, World, and Science.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  const featured = getFeaturedArticle();
  const secondary = articles.filter((a) => a.id !== featured.id && a.featured).slice(0, 3);
  const latestArticles = getLatestArticles(8);
  const trendingArticles = getTrendingArticles(5);
  const breakingItem = getBreakingNews();

  const techArticles = getArticlesByCategory('technology', 4);
  const indiaArticles = getArticlesByCategory('india', 4);
  const aiArticles = getArticlesByCategory('ai', 4);
  const businessArticles = getArticlesByCategory('business', 4);
  const scienceArticles = getArticlesByCategory('science', 4);

  return (
    <>
      {/* Breaking News Bar */}
      {breakingItem && <BreakingNewsBar item={breakingItem} />}

      {/* Hero */}
      <section aria-label="Today's top stories">
        <div className="container">
          <HeroSection featured={featured} secondary={secondary} />
        </div>
      </section>

      {/* Ad slot — after hero */}
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        <AdSlot id="ad-post-hero" width={728} height={90} />
      </div>

      {/* Latest + Trending side by side */}
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '4rem', alignItems: 'start' }}>
          <LatestNewsFeed articles={latestArticles} />
          <TrendingSection articles={trendingArticles} />
        </div>
      </div>

      {/* Category Sections */}
      <div className="container">
        {techArticles.length > 0 && (
          <CategorySection
            categoryName="Technology"
            categorySlug="technology"
            articles={techArticles}
          />
        )}

        {/* Mid-page ad */}
        <div style={{ padding: '2rem 0' }}>
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
      </div>

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  );
}
