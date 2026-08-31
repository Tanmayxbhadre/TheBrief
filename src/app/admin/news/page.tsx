import { prisma } from '@/lib/db';
import { AdminNewsClient } from '@/components/admin/AdminNewsClient';

// Ensure the page is dynamically rendered since it fetches real-time DB data
export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const [newsItems, categories] = await Promise.all([
    prisma.newsItem.findMany({
      where: {
        status: { in: ['DISCOVERED', 'REVIEW'] }
      },
      include: {
        source: true,
        category: true
      },
      orderBy: {
        discoveredAt: 'desc'
      },
      take: 100 // Limit for initial load
    }),
    prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  ]);

  return (
    <AdminNewsClient 
      initialItems={newsItems} 
      categories={categories} 
    />
  );
}
