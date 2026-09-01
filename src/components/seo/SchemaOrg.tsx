import { Article } from '@/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
const SITE_NAME = 'THE BRIEF';

interface SchemaOrgProps {
  article?: Article;
  pageType?: 'home' | 'article' | 'category' | 'search';
}

export default function SchemaOrg({ article }: SchemaOrgProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
    },
    sameAs: [
      'https://twitter.com/thebrief',
      'https://instagram.com/thebrief',
      'https://linkedin.com/company/thebrief',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const articleSchema = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        headline: article.title,
        description: article.description,
        image: [article.featuredImage],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: {
          '@type': 'Person',
          name: article.author.name,
          url: `${SITE_URL}/author/${article.author.slug}`,
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/${article.category.slug}/${article.slug}`,
        },
        articleSection: article.category.name,
        keywords: article.tags.join(', '),
        wordCount: article.content.split(/\s+/).length,
        timeRequired: `PT${article.readingTime}M`,
      }
    : null;

  const schemas = [organizationSchema, websiteSchema, ...(articleSchema ? [articleSchema] : [])];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
