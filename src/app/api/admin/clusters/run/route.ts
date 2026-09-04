import { NextResponse } from 'next/server';
import { clusterUnassignedNewsItems } from '@/lib/news/clustering';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await clusterUnassignedNewsItems();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      clustersCreated: result.clustersCreated,
      message: `Processed ${result.processed} news items into clusters`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Clustering run failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
