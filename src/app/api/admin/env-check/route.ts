import { NextResponse } from 'next/server';
import { getEnvironmentDiagnostics } from '@/lib/envCheck';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics = getEnvironmentDiagnostics();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    diagnostics,
  });
}
