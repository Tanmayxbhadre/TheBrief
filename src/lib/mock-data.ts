// ============================================================
// TheBrief — Mock Data
// Structured for easy API/CMS replacement later.
// Replace this file's exports with API calls when backend is ready.
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
  {
    id: 'a6',
    name: 'Arjun Kapoor',
    slug: 'arjun-kapoor',
    bio: 'Gaming and entertainment journalist.',
    twitter: '@arjunkapoor',
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
    seoDescription: "Comprehensive coverage of India's politics, economy, society, and governance. Read the latest news from across the country.",
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
  {
    id: 'c9',
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Films, music, streaming, OTT, and pop culture.',
    seoTitle: 'Entertainment News — THE BRIEF',
    seoDescription: 'Latest entertainment news covering Bollywood, Hollywood, OTT releases, music, and pop culture trends.',
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
    description:
      'Google has announced the next generation of its flagship AI model, capable of understanding and reasoning about live video streams in real time — a significant leap in multimodal AI capability.',
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
    featuredImage:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop',
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
      whatHappened:
        'Google announced Gemini Ultra 2.0 at Google I/O Extended, introducing the ability to understand and respond to live video streams in real time.',
      whyItMatters:
        'Real-time video understanding is a significant milestone in AI capability, opening new applications in healthcare, autonomous systems, and media.',
      keyDetails: [
        'Supports up to 10 hours of continuous video context',
        'Uses a new streaming attention mechanism',
        'API available from October 2026',
        'Enterprise partners include healthcare and automotive companies',
      ],
      whatsNext: 'Integration into Google Meet, YouTube, and Pixel devices is expected by Q1 2027.',
    },
    timeline: [
      {
        date: 'Aug 28, 2026',
        title: 'Rumours begin',
        description: 'Leaks about a major Google AI announcement circulate online.',
      },
      {
        date: 'Aug 31, 2026',
        title: 'Official announcement',
        description: 'Google unveils Gemini Ultra 2.0 at Google I/O Extended.',
      },
      {
        date: 'Oct 2026',
        title: 'API access opens',
        description: 'Developers gain access to the Gemini API with streaming video support.',
      },
      {
        date: 'Q1 2027',
        title: 'Consumer rollout',
        description: 'Features integrated into Google Meet, YouTube, and Pixel devices.',
      },
    ],
    sources: [
      { name: 'Google DeepMind Blog', url: 'https://deepmind.google' },
      { name: 'Google I/O Extended', url: 'https://io.google' },
    ],
  },
  {
    id: '2',
    title: "India's GDP Growth Forecast Revised Upward to 7.4% for FY2027",
    slug: 'india-gdp-growth-forecast-revised-7-4-percent-fy2027',
    description:
      "The International Monetary Fund has revised India's economic growth forecast upward, citing robust domestic consumption, strong services exports, and capital investment momentum.",
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
    featuredImage:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop',
    imageAlt: 'Indian economy growth visualization showing upward trend',
    tags: ['India', 'GDP', 'IMF', 'Economy', 'Growth'],
    readingTime: 4,
    featured: true,
    quickSummary: [
      "IMF raised India's GDP growth forecast to 7.4% for FY2027.",
      "India remains the world's fastest-growing major economy.",
      'Strong consumption, services exports, and capex drive the upgrade.',
      'Food inflation and oil prices remain key risks.',
    ],
    sources: [
      { name: 'IMF World Economic Outlook', url: 'https://imf.org' },
      { name: 'Reserve Bank of India', url: 'https://rbi.org.in' },
    ],
  },
  {
    id: '3',
    title: 'OpenAI Launches o3 Pro: A Research-Grade AI for Scientific Discovery',
    slug: 'openai-o3-pro-research-grade-ai-scientific-discovery',
    description:
      "OpenAI's new o3 Pro model targets scientific research institutions with dramatically improved reasoning on complex mathematical, chemical, and biological problems.",
    content: `
OpenAI has released o3 Pro, a specialized version of its o3 reasoning model designed specifically for scientific research. The model demonstrates substantially improved performance on graduate-level chemistry, biology, and mathematics benchmarks compared to any existing system.

## Key Capabilities

The model scores in the 99th percentile on the International Mathematics Olympiad benchmark and has set new records on protein structure prediction tasks previously dominated by Google's AlphaFold.

## Availability and Pricing

o3 Pro is available via the OpenAI API starting today. Research institutions can apply for subsidized access through the OpenAI Researcher Access Program.

## Response from the Scientific Community

Early access users from MIT, IIT Bombay, and the Max Planck Institute have reported significant productivity gains in literature review and hypothesis generation tasks.
    `.trim(),
    author: authors[0],
    category: categories[3],
    publishedAt: '2026-08-31T03:15:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=675&fit=crop',
    imageAlt: 'Scientific research visualization with AI and molecular structures',
    tags: ['OpenAI', 'o3', 'AI', 'Science', 'Research'],
    readingTime: 4,
    quickSummary: [
      'OpenAI released o3 Pro, optimized for scientific and research tasks.',
      'Outperforms all existing models on graduate-level STEM benchmarks.',
      'Available to research institutions via API starting today.',
    ],
    sources: [{ name: 'OpenAI Blog', url: 'https://openai.com/blog' }],
  },
  {
    id: '4',
    title: 'Apple Confirms iPhone 18 to Feature On-Device AI Inference Engine',
    slug: 'apple-iphone-18-on-device-ai-inference-engine',
    description:
      'Apple has confirmed the A20 chip inside iPhone 18 will include a dedicated neural inference engine capable of running large language models locally without internet connectivity.',
    content: `
Apple has officially confirmed that the iPhone 18, expected to launch in September 2026, will feature a dramatically upgraded neural engine within the A20 chip. The new architecture is capable of running LLM-class AI models entirely on the device.

## Why This Matters

Running large language models on-device eliminates the need to send data to remote servers, addressing user privacy concerns that have dogged cloud-based AI features. It also enables AI functionality without an internet connection.

## What Features It Will Power

Apple has hinted that on-device LLM capabilities will power a significantly upgraded Siri that can understand and respond to multi-turn conversations, summarize emails and documents, and generate text in context without sending data to Apple's servers.

## Technical Specifications

The A20 chip is rumoured to feature a 12-core neural engine with 35 TOPS (trillion operations per second) of AI compute — approximately 3x the performance of the A17 Pro used in iPhone 15.

## Competition Context

This announcement comes as Google's Pixel and Samsung Galaxy devices already feature similar on-device AI capabilities, but Apple's control of both hardware and software gives it a potential advantage in integration quality.
    `.trim(),
    author: authors[0],
    category: categories[0],
    publishedAt: '2026-08-31T02:30:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1200&h=675&fit=crop',
    imageAlt: 'Close-up of Apple iPhone showing the screen and hardware design',
    tags: ['Apple', 'iPhone', 'AI', 'On-Device', 'A20 chip'],
    readingTime: 3,
    quickSummary: [
      "Apple confirmed the iPhone 18 A20 chip has an on-device AI inference engine.",
      'LLM-class models will run without internet connectivity.',
      "This is a major shift in Apple's AI strategy.",
    ],
    sources: [
      { name: 'Apple Newsroom', url: 'https://apple.com/newsroom' },
      { name: 'Bloomberg Technology', url: 'https://bloomberg.com/technology' },
    ],
  },
  {
    id: '5',
    title: 'UN Climate Summit: 67 Nations Commit to Net-Zero Targets by 2045',
    slug: 'un-climate-summit-67-nations-net-zero-2045',
    description:
      'A landmark agreement at the United Nations Emergency Climate Summit saw 67 countries, including India, commit to net-zero carbon emissions five years ahead of the existing 2050 global target.',
    content: `
The United Nations Emergency Climate Summit concluded in Geneva with a landmark agreement signed by 67 nations committing to achieve net-zero carbon emissions by 2045, five years earlier than the previously agreed 2050 target.

## The Agreement

The accord, formally called the Geneva Climate Compact, includes binding national action plans to be submitted to the UN Framework Convention on Climate Change within 18 months. Countries that miss interim targets face trade consequences.

## India's Commitment

India is among the signatories, representing a significant diplomatic shift. The government announced an accelerated renewable energy target of 900 GW by 2035, and committed to phasing out coal power plants by 2038.

## Reaction from Climate Scientists

Scientists at the IPCC welcomed the agreement but cautioned that the 2045 target is still insufficient to limit global warming to 1.5°C above pre-industrial levels. Additional measures including carbon removal technologies will be required.

## What Comes Next

The agreement moves to ratification by national parliaments over the next 12 months. Implementation will be monitored through annual UN reviews beginning in 2028.
    `.trim(),
    author: authors[3],
    category: categories[2],
    publishedAt: '2026-08-30T18:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop',
    imageAlt: 'UN Climate Summit delegates in session',
    tags: ['Climate', 'UN', 'Net Zero', 'Environment', 'Global'],
    readingTime: 4,
    quickSummary: [
      '67 nations signed a new net-zero commitment at the UN Climate Summit.',
      'New target is 2045, five years ahead of the existing 2050 goal.',
      'India is among the signatories.',
      'Binding action plans must be submitted within 18 months.',
    ],
    sources: [
      { name: 'United Nations', url: 'https://un.org' },
      { name: 'IPCC', url: 'https://ipcc.ch' },
    ],
  },
  {
    id: '6',
    title: 'Zepto Raises ₹3,200 Crore in Series F, Valuation Hits $5.5 Billion',
    slug: 'zepto-raises-3200-crore-series-f-valuation-5-5-billion',
    description:
      'Quick commerce startup Zepto has secured ₹3,200 crore in a new funding round led by General Atlantic, pushing its valuation to $5.5 billion ahead of a planned IPO.',
    content: `
Zepto, the Mumbai-based quick commerce startup, has raised ₹3,200 crore in a Series F funding round led by General Atlantic, with participation from existing investors including StepStone and Nexus Venture Partners.

## Valuation and Dilution

The round values Zepto at $5.5 billion on a post-money basis, up from $3.6 billion in its previous round twelve months ago. The company has raised approximately $1.8 billion in total since its founding in 2021.

## Business Context

Zepto operates over 500 dark stores across 22 Indian cities and processes approximately 1.2 million orders per day. The company claims to be EBITDA-positive at the city level in its top 10 markets.

## IPO Plans

The company is targeting a public market listing on Indian exchanges in early 2027. Investment bankers from Kotak and Morgan Stanley have been mandated for the IPO process.

## Competitive Landscape

Zepto competes with Blinkit (owned by Zomato) and Swiggy Instamart. The quick commerce sector has seen rapid consolidation, with smaller players exiting the market over the past 18 months.
    `.trim(),
    author: authors[2],
    category: categories[6],
    publishedAt: '2026-08-31T06:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=675&fit=crop',
    imageAlt: 'Quick commerce delivery operations with packages and logistics',
    tags: ['Zepto', 'Startup', 'Funding', 'Quick Commerce', 'IPO'],
    readingTime: 3,
    quickSummary: [
      'Zepto raised ₹3,200 crore in Series F led by General Atlantic.',
      'Valuation reaches $5.5 billion.',
      'IPO is planned for early 2027.',
    ],
    sources: [{ name: 'Entrackr', url: 'https://entrackr.com' }],
  },
  {
    id: '7',
    title: "ISRO's Chandrayaan-4 Successfully Enters Lunar Orbit",
    slug: 'isro-chandrayaan-4-lunar-orbit-entry',
    description:
      "India's fourth lunar mission has successfully entered lunar orbit after a 30-day journey, setting up for the first Indian crewed lunar flyby mission next year.",
    content: `
ISRO's Chandrayaan-4 spacecraft successfully entered lunar orbit on Monday, completing the first major milestone of India's most ambitious deep space mission to date.

## The Manoeuvre

The lunar orbit insertion manoeuvre was performed at 03:17 IST and lasted approximately 22 minutes. ISRO's telemetry confirmed that the spacecraft entered an elliptical orbit approximately 100 km above the lunar surface.

## Mission Objectives

Chandrayaan-4 carries a suite of scientific instruments to map lunar subsurface water ice distribution. Data collected will inform site selection for India's upcoming lunar crewed mission planned for 2028.

## Technical Achievements

The mission marks the first time ISRO has successfully performed a multi-body trajectory using the Earth–Moon Lagrange point, a technique previously used only by NASA and ESA missions.

## What Comes Next

Over the next three weeks, the spacecraft will manoeuvre into its final science orbit. Scientific data transmission is expected to begin from October 15, 2026.
    `.trim(),
    author: authors[4],
    category: categories[5],
    publishedAt: '2026-08-31T01:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=675&fit=crop',
    imageAlt: 'Moon surface viewed from space with ISRO mission visualization',
    tags: ['ISRO', 'Chandrayaan', 'Moon', 'Space', 'India'],
    readingTime: 3,
    quickSummary: [
      'Chandrayaan-4 has successfully entered lunar orbit.',
      'The mission took 30 days of travel after launch.',
      "It sets up India's first crewed lunar flyby for 2027.",
    ],
    sources: [{ name: 'ISRO', url: 'https://isro.gov.in' }],
  },
  {
    id: '8',
    title: 'Microsoft Acquires Finnish AI Startup Nightshade for $2.1 Billion',
    slug: 'microsoft-acquires-nightshade-ai-2-1-billion',
    description:
      'Microsoft has agreed to acquire Helsinki-based Nightshade AI, known for its enterprise reasoning systems, in a deal that signals continued aggressive expansion in the enterprise AI sector.',
    content: `
Microsoft has signed a definitive agreement to acquire Helsinki-based Nightshade AI in an all-cash deal valued at $2.1 billion. The acquisition is subject to regulatory approval and is expected to close by end of 2026.

## What Nightshade Does

Nightshade builds enterprise AI reasoning systems specialised for legal, financial, and medical document analysis. Its technology is used by over 200 enterprise customers across Europe and North America.

## Strategic Rationale

Microsoft's acquisition signals a continued push into vertical AI — systems designed for specific industries rather than general purpose use. Nightshade's technology complements Microsoft's existing Copilot for Finance and Copilot for Legal products.

## Regulatory Considerations

Given the concentration of AI acquisitions by large technology companies, analysts expect the deal to face scrutiny from the European Commission. However, given Nightshade's relatively small market share, regulatory clearance is considered likely.

## Financial Details

Nightshade was last valued at $800 million in a 2025 Series D round. Microsoft's $2.1 billion offer represents a 2.6x premium, reflecting the strategic value of the technology rather than the company's current revenue run rate.
    `.trim(),
    author: authors[2],
    category: categories[4],
    publishedAt: '2026-08-30T14:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1200&h=675&fit=crop',
    imageAlt: 'Microsoft headquarters building in Redmond',
    tags: ['Microsoft', 'Acquisition', 'AI', 'Startup', 'Business'],
    readingTime: 3,
    quickSummary: [
      'Microsoft is acquiring Finnish AI startup Nightshade for $2.1 billion.',
      "The deal strengthens Microsoft's enterprise AI portfolio.",
      'Closing expected by end of 2026 pending regulatory approval.',
    ],
    sources: [
      { name: 'Microsoft Blog', url: 'https://blogs.microsoft.com' },
      { name: 'Reuters', url: 'https://reuters.com' },
    ],
  },
  {
    id: '9',
    title: 'India Passes Digital Personal Data Protection Rules Under DPDP Act',
    slug: 'india-digital-personal-data-protection-rules-dpdp-act',
    description:
      'The Ministry of Electronics and IT has formally notified the rules under the Digital Personal Data Protection Act, setting compliance timelines for tech companies operating in India.',
    content: `
The Ministry of Electronics and Information Technology notified the final rules under the Digital Personal Data Protection Act on Monday, marking a pivotal moment for data governance in India.

## Key Provisions

The rules mandate that any company processing personal data of Indian citizens must appoint a Data Protection Officer, publish a clear privacy policy in local languages, and comply with data deletion requests within 30 days.

## Compliance Timeline

Large tech platforms with more than 50 million Indian users must comply within 6 months. Smaller businesses have 18 months. The Data Protection Board, the enforcement body, will begin accepting complaints from January 2027.

## Impact on Tech Companies

Global technology companies including Google, Meta, Apple, and Amazon will need to make significant changes to their data practices. Companies that fail to comply face penalties of up to ₹250 crore per violation.

## Industry Reaction

Industry body NASSCOM has welcomed the rules but has sought clarifications on cross-border data transfer restrictions, which could affect how Indian data is processed by global cloud providers.
    `.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-31T07:30:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=675&fit=crop',
    imageAlt: 'Digital privacy and data protection concept illustration',
    tags: ['DPDP', 'Data Privacy', 'India', 'Regulation', 'Tech Policy'],
    readingTime: 4,
    featured: true,
    sources: [
      { name: 'MeitY', url: 'https://meity.gov.in' },
      { name: 'NASSCOM', url: 'https://nasscom.in' },
    ],
  },
  {
    id: '10',
    title: 'Anthropic Releases Claude 4 with 2-Million Token Context Window',
    slug: 'anthropic-claude-4-two-million-token-context',
    description:
      "Anthropic's latest flagship model extends context length to 2 million tokens — equivalent to roughly 20 full-length novels — enabling entirely new use cases in legal, scientific, and enterprise AI.",
    content: `
Anthropic has released Claude 4, the latest version of its flagship AI assistant, featuring a 2-million token context window that the company says is the largest available in any commercially released model.

## What 2 Million Tokens Means in Practice

At 2 million tokens, Claude 4 can process approximately 1,500 pages of text, 20 full-length novels, or an entire software codebase — in a single prompt. This unlocks use cases that were previously impossible: analysing an entire legal case file, reviewing a complete medical record history, or refactoring a large application at once.

## Performance Benchmarks

Anthropic claims Claude 4 significantly outperforms its predecessor on the Needle in a Haystack benchmark — a test of long-context recall — achieving near-perfect scores even at the maximum context length. This has historically been a weakness of large context models.

## Pricing

Claude 4 is priced at $15 per million input tokens and $75 per million output tokens — approximately 3x the cost of Claude 3.5 Sonnet, reflecting the computational demands of the larger context window.

## Safety Measures

Anthropic has introduced new safety evaluations specifically for long-context models, addressing concerns that models with very large context windows could be more susceptible to prompt injection attacks embedded in long documents.
    `.trim(),
    author: authors[0],
    category: categories[3],
    publishedAt: '2026-08-30T10:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?w=1200&h=675&fit=crop',
    imageAlt: 'Visualization of large-scale AI language model context processing',
    tags: ['Anthropic', 'Claude', 'AI', 'LLM', 'Context Window'],
    readingTime: 4,
    quickSummary: [
      'Claude 4 supports a 2-million token context window.',
      'This is the largest commercially available context window.',
      'Primary use cases include legal, scientific, and enterprise document analysis.',
    ],
    sources: [{ name: 'Anthropic', url: 'https://anthropic.com' }],
  },
  {
    id: '11',
    title: 'Sensex Crosses 90,000 for First Time on Foreign Inflows',
    slug: 'sensex-crosses-90000-foreign-inflows',
    description:
      'The BSE Sensex breached the 90,000 mark for the first time in history on Monday, fuelled by strong foreign institutional buying and positive global market sentiment.',
    content: `
The BSE Sensex crossed the psychologically significant 90,000 mark on Monday, driven by strong foreign institutional investor inflows and positive global market cues.

## Key Market Movers

Banking stocks led the rally, with HDFC Bank, ICICI Bank, and SBI all gaining more than 2%. IT sector stocks also rose sharply following the IMF's revised India growth forecast. RELIANCE Industries hit a new all-time high.

## FII Activity

Foreign institutional investors purchased a net ₹8,450 crore of Indian equities on Monday — the highest single-day inflow in over two years. Analysts attributed the buying to India's improved sovereign credit outlook and the strong macroeconomic data released earlier in the week.

## Context

The 90,000 milestone comes just eight months after the Sensex crossed 80,000, suggesting an acceleration in the index's upward trajectory. India's market capitalisation has now crossed $5 trillion for the first time.

## Outlook

Market strategists at Goldman Sachs and CLSA have maintained their year-end targets of 95,000 and 92,000 respectively. However, several analysts have cautioned that valuations are stretched and any global risk-off event could trigger a correction.
    `.trim(),
    author: authors[2],
    category: categories[4],
    publishedAt: '2026-08-31T08:45:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop',
    imageAlt: 'Stock market charts showing upward movement',
    tags: ['Sensex', 'Stock Market', 'BSE', 'FII', 'India'],
    readingTime: 3,
    sources: [
      { name: 'BSE India', url: 'https://bseindia.com' },
      { name: 'NSE India', url: 'https://nseindia.com' },
    ],
  },
  {
    id: '12',
    title: 'WHO Declares New Mpox Strain a Global Health Emergency',
    slug: 'who-mpox-new-strain-global-health-emergency',
    description:
      'The World Health Organization has declared a new, more transmissible strain of Mpox a global health emergency of international concern, urging accelerated vaccine production.',
    content: `
The World Health Organization on Monday declared a new strain of Mpox, designated Clade Ic, a public health emergency of international concern — the highest level of global health alert.

## The New Strain

Clade Ic was first identified in Central Africa in early 2026 and has since spread to 24 countries across three continents. Unlike previous Mpox strains, Clade Ic appears to spread more efficiently through respiratory droplets, raising concerns about its pandemic potential.

## WHO's Response

The WHO is coordinating a global vaccine response through the COVAX facility. The Bavarian Nordic Jynneos vaccine has been shown to be effective against the new strain in preliminary studies.

## India's Preparedness

India's Health Ministry has issued an advisory to state governments and has put airport health surveillance on alert. Two suspected cases are under investigation in Mumbai, though no confirmed Clade Ic infections have been reported in India.

## What You Should Know

The WHO advises avoiding close physical contact with people who have confirmed or suspected Mpox infections. There is no cause for panic — the virus is far less transmissible than influenza or COVID-19, and effective vaccines are available.
    `.trim(),
    author: authors[3],
    category: categories[2],
    publishedAt: '2026-08-31T09:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=1200&h=675&fit=crop',
    imageAlt: 'WHO headquarters and medical research symbolism',
    tags: ['WHO', 'Mpox', 'Health', 'Global', 'Emergency'],
    readingTime: 3,
    breaking: true,
    quickSummary: [
      'WHO declared new Mpox strain Clade Ic a global health emergency.',
      'The strain is present in 24 countries across 3 continents.',
      'Jynneos vaccine shown to be effective against the new strain.',
      'India has put airport health surveillance on alert.',
    ],
    sources: [
      { name: 'World Health Organization', url: 'https://who.int' },
      { name: 'Ministry of Health and Family Welfare', url: 'https://mohfw.gov.in' },
    ],
  },
  {
    id: '13',
    title: 'Tesla Launches Full Self-Driving Subscription in India',
    slug: 'tesla-full-self-driving-subscription-india-launch',
    description:
      "Tesla has officially launched its Full Self-Driving subscription in India at ₹14,999 per month, following regulatory clearance from the Ministry of Road Transport.",
    content: `
Tesla has launched its Full Self-Driving (FSD) subscription service in India, priced at ₹14,999 per month, following regulatory approval from the Ministry of Road Transport and Highways.

## What FSD Includes

The subscription unlocks Tesla's advanced driver-assistance suite, including automatic lane changes on highways, Autopilot on city streets, automatic parking, and smart summon features. Tesla emphasises that the system still requires driver supervision at all times.

## Regulatory Context

The MoRTH's clearance came with conditions: FSD cannot be used in areas flagged as school zones or near religious gatherings, and Tesla must submit quarterly safety reports to the ministry. The company must also maintain a local support team for regulatory coordination.

## Pricing and Availability

At ₹14,999/month, India's FSD pricing is lower than the US price of approximately ₹16,500/month equivalent. The service is currently available on Model 3 and Model Y vehicles. Model X and Model S are expected to be added by end of year.

## Safety Record

Tesla's FSD technology has been involved in several high-profile accidents in the US, and its India launch has attracted scrutiny from road safety advocates. However, Tesla points to its fleet-level safety statistics, which show lower accident rates per mile compared to human-driven vehicles.
    `.trim(),
    author: authors[0],
    category: categories[0],
    publishedAt: '2026-08-30T12:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1617704548623-340376564e68?w=1200&h=675&fit=crop',
    imageAlt: 'Tesla electric vehicle on Indian roads',
    tags: ['Tesla', 'FSD', 'Self-Driving', 'India', 'EV'],
    readingTime: 3,
    quickSummary: [
      'Tesla FSD subscription launches in India at ₹14,999/month.',
      'Regulatory clearance was granted by MoRTH.',
      'Currently available on Model 3 and Model Y.',
    ],
    sources: [
      { name: 'Tesla', url: 'https://tesla.com' },
      { name: 'MoRTH', url: 'https://morth.nic.in' },
    ],
  },
  {
    id: '14',
    title: 'India to Launch its Own Semiconductor Fab by 2028, PM Announces',
    slug: 'india-semiconductor-fab-2028-pm-announcement',
    description:
      "Prime Minister announced that India's first domestically built semiconductor fabrication plant will be operational by 2028, as part of the ₹76,000 crore India Semiconductor Mission.",
    content: `
The Prime Minister announced that India's first fully domestic semiconductor fabrication facility will be operational by 2028, as part of an expanded ₹76,000 crore India Semiconductor Mission.

## The Facility

The fab will be built in Dholera Special Investment Region in Gujarat. It is designed to produce chips at the 28nm node — not cutting-edge by global standards, but suitable for automotive, industrial, and consumer electronics applications.

## Partners

The project is being developed in partnership with a consortium of Tata Electronics, Applied Materials, and the Israel-based Tower Semiconductor. The government is providing a 50% capital subsidy.

## Strategic Significance

India currently imports nearly 100% of its semiconductors. Domestic chip production is seen as a strategic priority, particularly following supply chain disruptions during the COVID-19 pandemic.

## Job Creation

The facility is expected to create approximately 20,000 direct jobs and support a broader ecosystem of chip design and manufacturing firms in the region.
    `.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-30T16:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop',
    imageAlt: 'Semiconductor chip manufacturing facility with cleanroom environment',
    tags: ['Semiconductor', 'India', 'Manufacturing', 'Policy', 'Chips'],
    readingTime: 4,
    sources: [
      { name: 'India Semiconductor Mission', url: 'https://semiconductors.india.gov.in' },
      { name: 'PIB India', url: 'https://pib.gov.in' },
    ],
  },
  {
    id: '15',
    title: 'NASA Confirms Evidence of Ancient Liquid Water on Mars Surface',
    slug: 'nasa-confirms-ancient-liquid-water-mars',
    description:
      'Data from the Perseverance rover has provided the strongest evidence yet that liquid water once flowed across large regions of Mars, raising new questions about ancient life.',
    content: `
NASA scientists have announced what they describe as the strongest evidence to date that liquid water once existed on the Martian surface in large quantities, based on new mineralogical data from the Perseverance rover.

## The Discovery

The rover's SHERLOC instrument detected the presence of carbonates, sulfates, and phyllosilicates in a rock formation at Jezero Crater that is consistent with formation in a warm, shallow lake environment approximately 3.5 billion years ago.

## Why This Matters

The presence of liquid water is considered a prerequisite for life as we know it. If Mars once had stable bodies of liquid water, the planet may have been capable of supporting microbial life in its ancient past.

## Mars Sample Return Implications

NASA plans to return samples from Jezero Crater as part of the Mars Sample Return mission, now targeted for 2031. Scientists are particularly eager to analyse the carbonate formations for any preserved biosignatures.

## Remaining Questions

While the mineralogical evidence is compelling, scientists caution that liquid water alone does not confirm past life. Many other conditions — including the availability of energy sources and the right chemical gradients — are required for life to emerge.
    `.trim(),
    author: authors[4],
    category: categories[5],
    publishedAt: '2026-08-29T20:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1614728263952-84ea256f9d4d?w=1200&h=675&fit=crop',
    imageAlt: 'Mars surface panoramic view from NASA Perseverance rover',
    tags: ['NASA', 'Mars', 'Space', 'Water', 'Science'],
    readingTime: 4,
    sources: [
      { name: 'NASA JPL', url: 'https://jpl.nasa.gov' },
      { name: 'Nature Geoscience', url: 'https://nature.com/ngeo' },
    ],
  },
  {
    id: '16',
    title: "GTA VI Release Date Confirmed: Rockstar Sets November 2026 Launch",
    slug: 'gta-vi-release-date-confirmed-november-2026',
    description:
      "Rockstar Games has officially confirmed Grand Theft Auto VI will launch on November 14, 2026 for PlayStation 5 and Xbox Series X/S, ending years of speculation about the most anticipated game in history.",
    content: `
Rockstar Games has confirmed that Grand Theft Auto VI will launch worldwide on November 14, 2026 for PlayStation 5 and Xbox Series X/S — ending years of anticipation for what many consider the most anticipated game in the history of the medium.

## What We Know About the Game

GTA VI is set in Vice City and its surrounding state of Leonida, a fictional version of Florida. The game features dual protagonists for the first time in the series: Lucia, a woman, and Jason, her partner. The game's 2023 trailer has amassed over 200 million views.

## PC Release

Rockstar has confirmed a PC version will follow "in 2027." The company has historically released PC versions of GTA games 12–18 months after console launches.

## India Launch

The game will be available at midnight in India across PlayStation Store, Xbox Store, and major retail outlets. Pricing is expected to be ₹4,999 for the standard edition.

## Industry Impact

Analysts at Ampere Analysis estimate GTA VI will generate $3 billion in revenue in its first year of release, making it the highest-grossing entertainment product launch in history — surpassing records set by GTA V, which has sold over 200 million copies since 2013.

## Pre-Orders

Pre-orders open globally on September 1, 2026. Players who pre-order will receive in-game bonuses including exclusive vehicles and character outfits.
    `.trim(),
    author: authors[5],
    category: categories[7],
    publishedAt: '2026-08-31T10:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=675&fit=crop',
    imageAlt: 'Gaming controller and gaming setup with colorful lighting',
    tags: ['GTA VI', 'Rockstar', 'Gaming', 'PlayStation', 'Xbox'],
    readingTime: 4,
    featured: false,
    quickSummary: [
      'GTA VI confirmed for November 14, 2026 on PS5 and Xbox Series X/S.',
      'PC version expected in 2027.',
      'Standard edition priced at ₹4,999 in India.',
      'Pre-orders open September 1, 2026.',
    ],
    sources: [
      { name: 'Rockstar Games', url: 'https://rockstargames.com' },
      { name: 'Ampere Analysis', url: 'https://ampereanalysis.com' },
    ],
  },
  {
    id: '17',
    title: 'Netflix India Announces 10-Film Slate with Top Bollywood Directors',
    slug: 'netflix-india-10-film-slate-bollywood-directors',
    description:
      'Netflix India has revealed a major content slate of 10 original films for 2027, featuring top directors including Zoya Akhtar, Anurag Kashyap, and Vikramaditya Motwane.',
    content: `
Netflix India has announced its most ambitious original content slate yet: 10 original feature films scheduled for 2027, featuring some of the most celebrated directors in contemporary Indian cinema.

## The Lineup

Confirmed projects include a crime thriller by Anurag Kashyap, a romantic drama by Zoya Akhtar set in Bombay's music scene, and a science fiction film by Vikramaditya Motwane. Four additional projects remain unannounced but are expected to involve major stars.

## Investment Scale

Netflix is committing approximately ₹800 crore to the slate — its largest single-year investment in Indian originals to date. The company has been aggressively expanding its India production budget following strong subscriber growth.

## Competition Context

The announcement comes as Amazon Prime Video and JioCinema have both significantly increased their Indian content investments. Netflix India's subscriber base crossed 10 million in Q2 2026, driven largely by the success of regional-language content.

## Impact on Indian Cinema

The scale of OTT investment is reshaping the economics of Indian filmmaking. Several top directors who previously worked exclusively in theatrical releases are now signing multi-film deals with streaming platforms, attracted by creative freedom and guaranteed audiences.
    `.trim(),
    author: authors[5],
    category: categories[8],
    publishedAt: '2026-08-31T08:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=675&fit=crop',
    imageAlt: 'Film production set with camera and lighting equipment',
    tags: ['Netflix', 'Bollywood', 'Entertainment', 'OTT', 'India'],
    readingTime: 3,
    quickSummary: [
      'Netflix India announced 10 original films for 2027.',
      'Zoya Akhtar, Anurag Kashyap, and Vikramaditya Motwane among directors.',
      'Investment of approximately ₹800 crore committed.',
    ],
    sources: [{ name: 'Netflix', url: 'https://about.netflix.com' }],
  },
  {
    id: '18',
    title: 'India Wins T20 World Cup 2026, Defeating Australia in Final',
    slug: 'india-wins-t20-world-cup-2026-australia-final',
    description:
      'Team India has won the ICC T20 World Cup 2026, defeating Australia by 6 wickets in the final played at the MCG in Melbourne, completing a historic series win.',
    content: `
Team India has won the ICC T20 World Cup 2026, defeating Australia by 6 wickets in a dominant final performance at the Melbourne Cricket Ground, watched by a global television audience estimated at over 800 million people.

## The Match

Batting first, Australia posted 172/6 in their 20 overs. India's chase was anchored by Shubman Gill (78* off 42) and Hardik Pandya (45 off 22), who shared an unbroken 103-run partnership to seal the victory with 8 balls to spare.

## Rohit Sharma's Farewell

The World Cup final was also Rohit Sharma's final international match. The captain, who led India to the trophy for the second consecutive time, received a guard of honour from both teams after the match. He retires with 5 ICC trophies as captain.

## Celebration in India

Prime Minister's Office declared a public holiday on September 1 to mark the victory. Celebrations erupted across Indian cities, with large crowds gathering at stadium screening venues and public spaces.

## Historic Achievement

India becomes only the second team in history to win back-to-back T20 World Cups. The BCCI announced a ₹125 crore prize pool for the players, to be distributed by the selection committee.
    `.trim(),
    author: authors[1],
    category: categories[1],
    publishedAt: '2026-08-31T00:30:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1540747913346-19378d0b2a03?w=1200&h=675&fit=crop',
    imageAlt: 'Cricket team celebrating victory with trophy',
    tags: ['Cricket', 'India', 'T20 World Cup', 'Sports', 'BCCI'],
    readingTime: 3,
    featured: true,
    quickSummary: [
      'India beat Australia by 6 wickets in the T20 World Cup 2026 final.',
      "Shubman Gill scored 78* to anchor India's chase.",
      "It's Rohit Sharma's final international match.",
      'Back-to-back World Cup victory for India.',
    ],
    sources: [
      { name: 'ICC', url: 'https://icc-cricket.com' },
      { name: 'BCCI', url: 'https://bcci.tv' },
    ],
  },
  {
    id: '19',
    title: 'India Esports League Season 4 Draws Record 2 Million Live Viewers',
    slug: 'india-esports-league-season-4-record-viewers',
    description:
      "The India Esports League's Season 4 Grand Finals drew a record 2 million concurrent live viewers across YouTube and JioTV, marking a watershed moment for competitive gaming in India.",
    content: `
The India Esports League Season 4 Grand Finals drew a record 2 million concurrent live viewers across YouTube and JioTV, marking a watershed moment for competitive gaming in India and validating years of investment by developers and broadcasters.

## The Event

The Finals featured eight teams competing across BGMI (Battlegrounds Mobile India), Valorant, and Street Fighter 6. The BGMI segment alone accounted for 1.4 million of the concurrent viewers — reflecting the outsized popularity of mobile gaming in India.

## Commercial Significance

The viewership milestone attracted immediate attention from advertisers. Brands including Oneplus, Dream11, and Pepsi were among the title sponsors. Industry analysts estimate the event generated approximately ₹45 crore in sponsorship revenue.

## Government Recognition

The Ministry of Youth Affairs and Sports issued a statement acknowledging the milestone and reiterating the government's support for recognizing esports as a legitimate competitive sport. Esports India is now seeking to include gaming events at the national games.

## The Path Ahead

With this viewership benchmark, India has now established itself as one of Asia's top three esports markets by audience size. The IEL Season 5 is expected to expand to 12 teams and add a mobile MOBA category.
    `.trim(),
    author: authors[5],
    category: categories[7],
    publishedAt: '2026-08-30T20:00:00Z',
    featuredImage:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=675&fit=crop',
    imageAlt: 'Esports tournament arena with large screen and audience',
    tags: ['Esports', 'Gaming', 'India', 'IEL', 'BGMI'],
    readingTime: 3,
    sources: [
      { name: 'India Esports League', url: 'https://indiaesportsleague.com' },
    ],
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

export const getTrendingArticles = (limit = 5): Article[] => articles.slice(0, limit);

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

export const homepageCategories = ['technology', 'india', 'ai', 'business', 'science', 'gaming', 'entertainment'];
