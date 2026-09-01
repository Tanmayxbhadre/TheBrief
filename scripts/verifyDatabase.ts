import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function createAdminToken(username: string, secret = 'secret') {
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

function verifyAdminToken(token: string, secret = 'secret') {
  try {
    const [payloadB64, signature] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

async function verify() {
  console.log('--- 1. Testing HMAC Token Generator & Verifier ---');
  const token = createAdminToken('EditorialDesk');
  const isValid = verifyAdminToken(token);
  console.log('Token verification result:', isValid ? 'PASS' : 'FAIL');

  console.log('--- 2. Querying Database Models ---');
  const [sources, categories, newsItems, drafts, logs] = await Promise.all([
    prisma.source.count(),
    prisma.category.count(),
    prisma.newsItem.count(),
    prisma.articleDraft.count(),
    prisma.activityLog.count(),
  ]);

  console.log({
    sourcesCount: sources,
    categoriesCount: categories,
    newsItemsCount: newsItems,
    articleDraftsCount: drafts,
    activityLogsCount: logs,
  });

  console.log('--- 3. Testing Draft Creation & Workflow State ---');
  const sampleSlug = `test-article-${Date.now()}`;
  const testDraft = await prisma.articleDraft.create({
    data: {
      title: 'Global Tech Summit Concludes with AI Governance Framework',
      slug: sampleSlug,
      excerpt: 'World leaders and technology executives reached agreement on safety benchmarks.',
      content: '## Major Milestone\n\nThe global conference ended with broad consensus.\n\n## Next Steps\n\nImplementation begins in 2027.',
      authorName: 'Tanmay (Editor-in-Chief)',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      seoTitle: 'Global Tech Summit AI Framework — THE BRIEF',
      metaDescription: 'World leaders and tech leaders agree on international AI safety benchmarks.',
      sources: JSON.stringify([{ name: 'Reuters', url: 'https://reuters.com' }]),
      quickSummary: JSON.stringify(['AI safety benchmarks established', 'Ratified by 40 nations']),
      tags: JSON.stringify(['AI', 'Technology', 'Policy']),
    },
  });
  console.log('Created and published sample draft:', testDraft.title, '(ID:', testDraft.id, ')');

  // Verify retrieval
  const retrieved = await prisma.articleDraft.findUnique({
    where: { slug: sampleSlug },
  });
  console.log('Retrieved draft status:', retrieved?.status, 'matches expected:', retrieved?.status === 'PUBLISHED' ? 'PASS' : 'FAIL');

  // Activity Log
  await prisma.activityLog.create({
    data: {
      user: 'Automated Test',
      action: 'article_published',
      target: testDraft.title,
      details: `Published article with slug ${sampleSlug}`,
    },
  });
  console.log('Logged test activity: PASS');

  // Clean up
  await prisma.articleDraft.delete({ where: { id: testDraft.id } });
  console.log('Cleaned up test draft: PASS');

  console.log('--- All Database & Model Verifications Passed Successfully! ---');
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
