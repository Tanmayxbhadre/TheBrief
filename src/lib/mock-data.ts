// ============================================================
// TheBrief — Mock Data
// Structured for easy API/CMS replacement later.
// ============================================================

import { Article, Author, Category, BreakingNewsItem } from './types';

// ─── Authors ────────────────────────────────────────────────

export const authors: Author[] = [
  {
    id: 'a1',
    name: 'Priya Sharma',
    slug: 'priya-sharma',
    bio: 'Senior correspondent covering technology and artificial intelligence.',
    twitter: '@priyasharma',
  },
  {
    id: 'a2',
    name: 'Rahul Mehta',
    slug: 'rahul-mehta',
    bio: 'Political and national affairs reporter based in New Delhi.',
    twitter: '@rahulmehta',
  },
  {
    id: 'a3',
    name: 'Ananya Krishnan',
    slug: 'ananya-krishnan',
    bio: 'Business and startup ecosystem journalist.',
    twitter: '@ananyak',
  },
  {
    id: 'a4',
    name: 'Vikram Nair',
    slug: 'vikram-nair',
    bio: 'International affairs and geopolitics correspondent.',
    twitter: '@vikramnair',
  },
  {
    id: 'a5',
    name: 'Divya Reddy',
    slug: 'divya-reddy',
    bio: 'Science and environment reporter.',
    twitter: '@divyareddy',
  },
];

// ─── Categories ─────────────────────────────────────────────

export const categories: Category[] = [
  {
    id: 'c1',
    name: 'Technology',
    slug: 'technology',
    description: 'Latest technology news, product launches, and digital innovation.',
    seoTitle: 'Technology News — THE BRIEF',
    seoDescription: 'Stay updated with the latest technology news, product launches, AI developments, and major announcements from the world of tech.',
  },
  {
    id: 'c2',
    name: 'India',
    slug: 'india',
    description: 'National news, politics, economy, and society from across India.',
    seoTitle: 'India News — THE BRIEF',
    seoDescription: 'Comprehensive coverage of India\'s politics, economy, society, and governance. Read the latest news from across the country.',
  },
  {
    id: 'c3',
    name: 'World',
    slug: 'world',
    description: 'International news, geopolitics, and global developments.',
    seoTitle: 'World News — THE BRIEF',
    seoDescription: 'Follow the latest international news, global developments, and geopolitical events from around the world.',
  },
  {
    id: 'c4',
    name: 'AI',
    slug: 'ai',
    description: 'Artificial intelligence breakthroughs, products, and policy.',
    seoTitle: 'AI News — THE BRIEF',
    seoDescription: 'Latest artificial intelligence news: model releases, research breakthroughs, AI policy, and the companies shaping the future.',
  },
  {
    id: 'c5',
    name: 'Business',
    slug: 'business',
    description: 'Markets, economy, startups, and corporate India.',
    seoTitle: 'Business News — THE BRIEF',
    seoDescription: 'Covering Indian and global markets, startup funding, corporate news, economic policy, and financial markets.',
  },
  {
    id: 'c6',
    name: 'Science',
    slug: 'science',
    description: 'Scientific discoveries, space exploration, and climate.',
    seoTitle: 'Science News — THE BRIEF',
    seoDescription: 'Latest science news: research discoveries, space missions, climate change, and breakthroughs in medicine and biology.',
  },
  {
    id: 'c7',
    name: 'Startups',
    slug: 'startups',
    description: 'Startup funding, founders, and Indian tech ecosystem.',
    seoTitle: 'Startup News — THE BRIEF',
    seoDescription: 'Indian and global startup news: funding rounds, founder stories, product launches, and ecosystem updates.',
  },
  {
    id: 'c8',
    name: 'Gaming',
    slug: 'gaming',
    description: 'Game releases, esports, and gaming industry news.',
    seoTitle: 'Gaming News — THE BRIEF',
    seoDescription: 'Latest gaming news including game releases, esports tournaments, and major gaming industry developments.',
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

// ─── Articles ───────────────────────────────────────────────

export const articles: Article[] = [
  {
    id: '1',
    title: 'Google Unveils Gemini Ultra 2.0 with Real-Time Video Understanding',
    slug: 'google-gemini-ultra-2-real-time-video',
    description: 'Google has announced the next generation of its flagship AI model, capable of understanding and reasoning about live video streams in real time — a significant leap in multimodal AI capability.',
    content: `
Google has unveiled Gemini Ultra 2.0, the most capable version of its large language model to date, introducing a groundbreaking ability to understand and reason about live video streams in real time.

## What Makes This Different

Unlike previous AI models that could only analyze video clips after they were recorded, Gemini Ultra 2.0 processes live video feeds with near-zero latency. This means the model can observe, interpret, and respond to unfolding events as they happen — not just analyze static frames.

In a demonstration at Google I/O Extended, the model watched a live cooking demonstration and offered step-by-step guidance without any pre-recorded script. It identified ingredients, noticed when heat levels were too high, and suggested adjustments in natural language.

## Technical Architecture

According to Google's DeepMind team, the new model uses a novel streaming attention mechanism that allows it to maintain context across continuously arriving frames without re-processing the entire video buffer. This is a significant departure from how previous vision-language models operated.

The model supports 10 hours of continuous video context — substantially more than any competing system.

## What This Means for Developers

Google has announced that Gemini Ultra 2.0 will be available through the Gemini API with streaming video support starting from October 2026. Pricing will follow a per-minute-of-video model.

Early access partners include healthcare monitoring providers, autonomous vehicle teams, and broadcast media companies.

## Industry Response

OpenAI and Anthropic have not yet publicly commented on Google's announcement. However, analysts at Bernstein Research noted that this capability — if it performs as demonstrated — would represent a "genuine lead" for Google in enterprise AI deployment.

## What Happens Next

Google is expected to integrate streaming video capabilities into Google Meet and YouTube within Q1 2027. Consumer-facing features are likely to appear in Pixel devices by early 2027.
    `.trim(),
    author: authors[0],
    category: categories[0],
    publishedAt: '2026-08-31T05:30:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop',
    imageAlt: 'Abstract visualization of AI neural networks and data streams',
    tags: ['Google', 'Gemini', 'AI', 'Video AI', 'Multimodal'],
    readingTime: 5,
    featured: true,
    quickSummary: [
      'Google launched Gemini Ultra 2.0 with real-time live video understanding.',
      'The model can process live video feeds with near-zero latency.',
      'API access for developers begins in October 2026.',
      'Features will reach consumer products by early 2027.',
    ],
    whatYouNeedToKnow: {
      whatHappened: 'Google announced Gemini Ultra 2.0 at Google I/O Extended, introducing the ability to understand and respond to live video streams in real time.',
      whyItMatters: 'Real-time video understanding is a significant milestone in AI capability, opening new applications in healthcare, autonomous systems, and media.',
      keyDetails: [
        'Supports up to 10 hours of continuous video context',
        'Uses a new streaming attention mechanism',
        'API available from October 2026',
        'Enterprise partners include healthcare and automotive companies',
      ],
      whatsNext: 'Integration into Google Meet, YouTube, and Pixel devices is expected by Q1 2027.',
    },
    sources: [
      { name: 'Google DeepMind Blog', url: 'https://deepmind.google' },
      { name: 'Google I/O Extended', url: 'https://io.google' },
    ],
  },
  {
    id: '2',
    title: 'India\'s GDP Growth Forecast Revised Upward to 7.4% for FY2027',
    slug: 'india-gdp-growth-forecast-revised-7-4-percent-fy2027',
    description: 'The International Monetary Fund has revised India\'s economic growth forecast upward, citing robust domestic consumption, strong services exports, and capital investment momentum.',
    content: `
The International Monetary Fund revised India's GDP growth forecast upward to 7.4% for the financial year 2026–27, making it the fastest-growing major economy in the world for the third consecutive year.

## What Drove the Revision

The IMF cited three primary factors behind the upgrade: stronger-than-expected private consumption, continued momentum in services exports — particularly IT and financial services — and a meaningful uptick in government capital expenditure in the first quarter.

India's manufacturing sector also surprised to the upside, with the HSBC Manufacturing PMI recording its highest reading since 2010.

## Structural Tailwinds

Economists have pointed to several structural factors underpinning India's growth: a young working-age population, rapid digital adoption, and a growing middle class with increasing purchasing power.

The production-linked incentive scheme has begun generating meaningful output from electronics and pharmaceutical manufacturing, which were previously weak spots.

## What This Means for Markets

Indian equity markets responded positively to the revision, with the Nifty 50 index rising 1.2% on Monday. Foreign institutional investors purchased ₹4,200 crore of Indian equities on the day of the announcement.

The Reserve Bank of India has maintained its own forecast at 7.2% but is expected to revise it in the October monetary policy review.

## Concerns and Risks

Despite the positive headline, economists have flagged risks including elevated food inflation, which has kept the overall CPI above the RBI's comfort zone. Geopolitical uncertainty in the Middle East also poses a risk to oil prices, which could widen the current account deficit.
    `.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-31T04:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop',
    imageAlt: 'Indian economy growth visualization showing upward trend',
    tags: ['India', 'GDP', 'IMF', 'Economy', 'Growth'],
    readingTime: 4,
    featured: true,
    quickSummary: [
      'IMF raised India\'s GDP growth forecast to 7.4% for FY2027.',
      'India remains the world\'s fastest-growing major economy.',
      'Strong consumption, services exports, and capex drive the upgrade.',
      'Food inflation and oil prices remain key risks.',
    ],
  },
  {
    id: '3',
    title: 'OpenAI Launches o3 Pro: A Research-Grade AI for Scientific Discovery',
    slug: 'openai-o3-pro-research-grade-ai-scientific-discovery',
    description: 'OpenAI\'s new o3 Pro model targets scientific research institutions with dramatically improved reasoning on complex mathematical, chemical, and biological problems.',
    content: `OpenAI has released o3 Pro, a specialized version of its o3 reasoning model designed specifically for scientific research. The model demonstrates substantially improved performance on graduate-level chemistry, biology, and mathematics benchmarks compared to any existing system.`.trim(),
    author: authors[0],
    category: categories[3],
    publishedAt: '2026-08-31T03:15:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=675&fit=crop',
    imageAlt: 'Scientific research visualization with AI and molecular structures',
    tags: ['OpenAI', 'o3', 'AI', 'Science', 'Research'],
    readingTime: 4,
    quickSummary: [
      'OpenAI released o3 Pro, optimized for scientific and research tasks.',
      'Outperforms all existing models on graduate-level STEM benchmarks.',
      'Available to research institutions via API starting today.',
    ],
  },
  {
    id: '4',
    title: 'Apple Confirms iPhone 18 to Feature On-Device AI Inference Engine',
    slug: 'apple-iphone-18-on-device-ai-inference-engine',
    description: 'Apple has confirmed the A20 chip inside iPhone 18 will include a dedicated neural inference engine capable of running large language models locally without internet connectivity.',
    content: `Apple has officially confirmed that the iPhone 18, expected to launch in September 2026, will feature a dramatically upgraded neural engine within the A20 chip. The new architecture is capable of running LLM-class AI models entirely on the device.`.trim(),
    author: authors[0],
    category: categories[0],
    publishedAt: '2026-08-31T02:30:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1200&h=675&fit=crop',
    imageAlt: 'Close-up of Apple iPhone showing the screen and hardware design',
    tags: ['Apple', 'iPhone', 'AI', 'On-Device', 'A20 chip'],
    readingTime: 3,
    quickSummary: [
      'Apple confirmed the iPhone 18 A20 chip has an on-device AI inference engine.',
      'LLM-class models will run without internet connectivity.',
      'This is a major shift in Apple\'s AI strategy.',
    ],
  },
  {
    id: '5',
    title: 'UN Climate Summit: 67 Nations Commit to Net-Zero Targets by 2045',
    slug: 'un-climate-summit-67-nations-net-zero-2045',
    description: 'A landmark agreement at the United Nations Emergency Climate Summit saw 67 countries, including India, commit to net-zero carbon emissions five years ahead of the existing 2050 global target.',
    content: `The United Nations Emergency Climate Summit concluded in Geneva with a landmark agreement signed by 67 nations committing to achieve net-zero carbon emissions by 2045, five years earlier than the previously agreed 2050 target.`.trim(),
    author: authors[3],
    category: categories[2],
    publishedAt: '2026-08-30T18:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop',
    imageAlt: 'UN Climate Summit delegates in session',
    tags: ['Climate', 'UN', 'Net Zero', 'Environment', 'Global'],
    readingTime: 4,
    quickSummary: [
      '67 nations signed a new net-zero commitment at the UN Climate Summit.',
      'New target is 2045, five years ahead of the existing 2050 goal.',
      'India is among the signatories.',
    ],
  },
  {
    id: '6',
    title: 'Zepto Raises ₹3,200 Crore in Series F, Valuation Hits $5.5 Billion',
    slug: 'zepto-raises-3200-crore-series-f-valuation-5-5-billion',
    description: 'Quick commerce startup Zepto has secured ₹3,200 crore in a new funding round led by General Atlantic, pushing its valuation to $5.5 billion ahead of a planned IPO.',
    content: `Zepto, the Mumbai-based quick commerce startup, has raised ₹3,200 crore in a Series F funding round led by General Atlantic, with participation from existing investors including StepStone and Nexus Venture Partners.`.trim(),
    author: authors[2],
    category: categories[6],
    publishedAt: '2026-08-31T06:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=675&fit=crop',
    imageAlt: 'Quick commerce delivery operations with packages and logistics',
    tags: ['Zepto', 'Startup', 'Funding', 'Quick Commerce', 'IPO'],
    readingTime: 3,
    quickSummary: [
      'Zepto raised ₹3,200 crore in Series F led by General Atlantic.',
      'Valuation reaches $5.5 billion.',
      'IPO is planned for early 2027.',
    ],
  },
  {
    id: '7',
    title: 'ISRO\'s Chandrayaan-4 Successfully Enters Lunar Orbit',
    slug: 'isro-chandrayaan-4-lunar-orbit-entry',
    description: 'India\'s fourth lunar mission has successfully entered lunar orbit after a 30-day journey, setting up for the first Indian crewed lunar flyby mission next year.',
    content: `ISRO's Chandrayaan-4 spacecraft successfully entered lunar orbit on Monday, completing the first major milestone of India's most ambitious deep space mission to date.`.trim(),
    author: authors[4],
    category: categories[5],
    publishedAt: '2026-08-31T01:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=675&fit=crop',
    imageAlt: 'Moon surface viewed from space with ISRO mission visualization',
    tags: ['ISRO', 'Chandrayaan', 'Moon', 'Space', 'India'],
    readingTime: 3,
    quickSummary: [
      'Chandrayaan-4 has successfully entered lunar orbit.',
      'The mission took 30 days of travel after launch.',
      'It sets up India\'s first crewed lunar flyby for 2027.',
    ],
  },
  {
    id: '8',
    title: 'Microsoft Acquires Finnish AI Startup Nightshade for $2.1 Billion',
    slug: 'microsoft-acquires-nightshade-ai-2-1-billion',
    description: 'Microsoft has agreed to acquire Helsinki-based Nightshade AI, known for its enterprise reasoning systems, in a deal that signals continued aggressive expansion in the enterprise AI sector.',
    content: `Microsoft has signed a definitive agreement to acquire Helsinki-based Nightshade AI in an all-cash deal valued at $2.1 billion. The acquisition is subject to regulatory approval and is expected to close by end of 2026.`.trim(),
    author: authors[2],
    category: categories[4],
    publishedAt: '2026-08-30T14:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1200&h=675&fit=crop',
    imageAlt: 'Microsoft headquarters building in Redmond',
    tags: ['Microsoft', 'Acquisition', 'AI', 'Startup', 'Business'],
    readingTime: 3,
    quickSummary: [
      'Microsoft is acquiring Finnish AI startup Nightshade for $2.1 billion.',
      'The deal strengthens Microsoft\'s enterprise AI portfolio.',
      'Closing expected by end of 2026 pending regulatory approval.',
    ],
  },
  {
    id: '9',
    title: 'India Passes Digital Personal Data Protection Rules Under DPDP Act',
    slug: 'india-digital-personal-data-protection-rules-dpdp-act',
    description: 'The Ministry of Electronics and IT has formally notified the rules under the Digital Personal Data Protection Act, setting compliance timelines for tech companies operating in India.',
    content: `The Ministry of Electronics and Information Technology notified the final rules under the Digital Personal Data Protection Act on Monday, marking a pivotal moment for data governance in India.`.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-31T07:30:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=675&fit=crop',
    imageAlt: 'Digital privacy and data protection concept illustration',
    tags: ['DPDP', 'Data Privacy', 'India', 'Regulation', 'Tech Policy'],
    readingTime: 4,
    featured: true,
  },
  {
    id: '10',
    title: 'Anthropic Releases Claude 4 with 2-Million Token Context Window',
    slug: 'anthropic-claude-4-two-million-token-context',
    description: 'Anthropic\'s latest flagship model extends context length to 2 million tokens — equivalent to roughly 20 full-length novels — enabling entirely new use cases in legal, scientific, and enterprise AI.',
    content: `Anthropic has released Claude 4, the latest version of its flagship AI assistant, featuring a 2-million token context window that the company says is the largest available in any commercially released model.`.trim(),
    author: authors[0],
    category: categories[3],
    publishedAt: '2026-08-30T10:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?w=1200&h=675&fit=crop',
    imageAlt: 'Visualization of large-scale AI language model context processing',
    tags: ['Anthropic', 'Claude', 'AI', 'LLM', 'Context Window'],
    readingTime: 4,
    quickSummary: [
      'Claude 4 supports a 2-million token context window.',
      'This is the largest commercially available context window.',
      'Primary use cases include legal, scientific, and enterprise document analysis.',
    ],
  },
  {
    id: '11',
    title: 'Sensex Crosses 90,000 for First Time on Foreign Inflows',
    slug: 'sensex-crosses-90000-foreign-inflows',
    description: 'The BSE Sensex breached the 90,000 mark for the first time in history on Monday, fuelled by strong foreign institutional buying and positive global market sentiment.',
    content: `The BSE Sensex crossed the psychologically significant 90,000 mark on Monday, driven by strong foreign institutional investor inflows and positive global market cues.`.trim(),
    author: authors[2],
    category: categories[4],
    publishedAt: '2026-08-31T08:45:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop',
    imageAlt: 'Stock market charts showing upward movement',
    tags: ['Sensex', 'Stock Market', 'BSE', 'FII', 'India'],
    readingTime: 3,
  },
  {
    id: '12',
    title: 'WHO Declares New Mpox Strain a Global Health Emergency',
    slug: 'who-mpox-new-strain-global-health-emergency',
    description: 'The World Health Organization has declared a new, more transmissible strain of Mpox a global health emergency of international concern, urging accelerated vaccine production.',
    content: `The World Health Organization on Monday declared a new strain of Mpox, designated Clade Ic, a public health emergency of international concern — the highest level of global health alert.`.trim(),
    author: authors[3],
    category: categories[2],
    publishedAt: '2026-08-31T09:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=1200&h=675&fit=crop',
    imageAlt: 'WHO headquarters and medical research symbolism',
    tags: ['WHO', 'Mpox', 'Health', 'Global', 'Emergency'],
    readingTime: 3,
    breaking: true,
  },
  {
    id: '13',
    title: 'Tesla Launches Full Self-Driving Subscription in India',
    slug: 'tesla-full-self-driving-subscription-india-launch',
    description: 'Tesla has officially launched its Full Self-Driving subscription in India at ₹14,999 per month, following regulatory clearance from the Ministry of Road Transport.',
    content: `Tesla has launched its Full Self-Driving (FSD) subscription service in India, priced at ₹14,999 per month, following regulatory approval from the Ministry of Road Transport and Highways.`.trim(),
    author: authors[0],
    category: categories[0],
    publishedAt: '2026-08-30T12:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1617704548623-340376564e68?w=1200&h=675&fit=crop',
    imageAlt: 'Tesla electric vehicle on Indian roads',
    tags: ['Tesla', 'FSD', 'Self-Driving', 'India', 'EV'],
    readingTime: 3,
    quickSummary: [
      'Tesla FSD subscription launches in India at ₹14,999/month.',
      'Regulatory clearance was granted by MoRTH.',
      'Currently available on Model 3 and Model Y.',
    ],
  },
  {
    id: '14',
    title: 'India to Launch its Own Semiconductor Fab by 2028, PM Announces',
    slug: 'india-semiconductor-fab-2028-pm-announcement',
    description: 'Prime Minister announced that India\'s first domestically built semiconductor fabrication plant will be operational by 2028, as part of the ₹76,000 crore India Semiconductor Mission.',
    content: `The Prime Minister announced that India's first fully domestic semiconductor fabrication facility will be operational by 2028, as part of an expanded ₹76,000 crore India Semiconductor Mission.`.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-30T16:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop',
    imageAlt: 'Semiconductor chip manufacturing facility with cleanroom environment',
    tags: ['Semiconductor', 'India', 'Manufacturing', 'Policy', 'Chips'],
    readingTime: 4,
  },
  {
    id: '15',
    title: 'NASA Confirms Evidence of Ancient Liquid Water on Mars Surface',
    slug: 'nasa-confirms-ancient-liquid-water-mars',
    description: 'Data from the Perseverance rover has provided the strongest evidence yet that liquid water once flowed across large regions of Mars, raising new questions about ancient life.',
    content: `NASA scientists have announced what they describe as the strongest evidence to date that liquid water once existed on the Martian surface in large quantities, based on new mineralogical data from the Perseverance rover.`.trim(),
    author: authors[4],
    category: categories[5],
    publishedAt: '2026-08-29T20:00:00Z',
    featuredImage: 'https://images.unsplash.com/photo-1614728263952-84ea256f9d4d?w=1200&h=675&fit=crop',
    imageAlt: 'Mars surface panoramic view from NASA Perseverance rover',
    tags: ['NASA', 'Mars', 'Space', 'Water', 'Science'],
    readingTime: 4,
  },
];

// ─── Getters ────────────────────────────────────────────────

export const getFeaturedArticle = (): Article =>
  articles.find((a) => a.featured) ?? articles[0];

export const getFeaturedArticles = (count = 3): Article[] =>
  articles.filter((a) => a.featured).slice(0, count);

export const getArticlesByCategory = (categorySlug: string, limit?: number): Article[] => {
  const result = articles.filter((a) => a.category.slug === categorySlug);
  return limit ? result.slice(0, limit) : result;
};

export const getLatestArticles = (limit = 10): Article[] =>
  [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);

export const getTrendingArticles = (limit = 5): Article[] =>
  articles.slice(0, limit);

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug);

export const getRelatedArticles = (article: Article, count = 4): Article[] =>
  articles
    .filter((a) => a.id !== article.id && a.category.slug === article.category.slug)
    .slice(0, count);

export const searchArticles = (query: string): Article[] => {
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.name.toLowerCase().includes(q)
  );
};

// ─── Breaking News ───────────────────────────────────────────

export const breakingNews: BreakingNewsItem[] = [
  {
    id: 'b1',
    headline: 'WHO declares new Mpox strain a global health emergency',
    url: '/world/who-mpox-new-strain-global-health-emergency',
    time: '2026-08-31T09:00:00Z',
  },
];

export const getBreakingNews = (): BreakingNewsItem | undefined => breakingNews[0];

// ─── Homepage categories to display ─────────────────────────

export const homepageCategories = ['technology', 'india', 'ai', 'business', 'science'];
