import { NextResponse } from 'next/server';
import { verifyAdminPassword, setAdminSessionCookie, recordActivity } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const user = username?.trim() || 'Admin Editor';
    await setAdminSessionCookie(user);
    await recordActivity('user_logged_in', 'admin_session', `User ${user} logged into newsroom`, user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
