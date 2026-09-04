import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getRelatedArticles,
  articles,
} from '@/lib/mock-data';
import { getPublishedArticleBySlug } from '@/lib/articles';
import ArticleHeader from '@/components/article/ArticleHeader';
import ArticleBody from '@/components/article/ArticleBody';
import QuickSummary from '@/components/article/QuickSummary';
import WhatYouNeedToKnow from '@/components/article/WhatYouNeedToKnow';
import Timeline from '@/components/article/Timeline';
import RelatedStories from '@/components/article/RelatedStories';
import AdSlot from '@/components/shared/AdSlot';
import SchemaOrg from '@/components/seo/SchemaOrg';
import SocialShare from '@/components/article/SocialShare';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  return articles.map((a) => ({
    category: a.category.slug,
    slug: a.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return {};

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
  const url = `${SITE_URL}/${article.category.slug}/${article.slug}`;

  return {
    title: article.title,
    description: article.description,
    authors: [{ name: article.author.name }],
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      section: article.category.name,
      tags: article.tags,
      images: [
        {
          url: article.featuredImage,
          width: 1200,
          height: 675,
          alt: article.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [article.featuredImage],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article || article.category.slug !== category) notFound();

  const relatedArticles = getRelatedArticles(article, 4);

  return (
    <>
      <SchemaOrg article={article} pageType="article" />

      <article itemScope itemType="https://schema.org/NewsArticle">
        {/* Article Header */}
        <ArticleHeader article={article} />

        <div className="article-container">
          <SocialShare
            title={article.title}
            url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in'}/${article.category.slug}/${article.slug}`}
          />
        </div>

        {/* Ad slot below header */}
        <div className="article-container" style={{ paddingBottom: '2rem' }}>
          <AdSlot id="ad-article-top" width={728} height={90} />
        </div>

        {/* Article Body */}
        <div className="article-container">
          {/* Quick Summary */}
          {article.quickSummary && article.quickSummary.length > 0 && (
            <QuickSummary points={article.quickSummary} />
          )}

          {/* What You Need To Know */}
          {article.whatYouNeedToKnow && (
            <WhatYouNeedToKnow data={article.whatYouNeedToKnow} />
          )}
        </div>

        {/* Body Content */}
        <ArticleBody article={article} />

        {/* Ad slot between content and related */}
        <div className="article-container" style={{ paddingBottom: '2rem' }}>
          <AdSlot id="ad-article-mid" width={728} height={90} />
        </div>

        {/* Timeline */}
        {article.timeline && article.timeline.length > 0 && (
          <div className="article-container">
            <Timeline events={article.timeline} />
          </div>
        )}
      </article>

      {/* Related Stories */}
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <RelatedStories articles={relatedArticles} />
      </div>
    </>
  );
}
