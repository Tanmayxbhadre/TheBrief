import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminSession, recordActivity } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (session.authenticated) {
      await recordActivity('user_logged_out', 'admin_session', `User ${session.user} logged out`, session.user);
    }
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Logout failed' }, { status: 500 });
  }
}
