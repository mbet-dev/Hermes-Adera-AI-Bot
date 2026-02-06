import { NextRequest, NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { supabaseServer, supabaseClient } from '@/lib/supabase';

// Hardcoded admin credentials (strongly typed)
const ADMIN_CREDENTIALS = {
  username: 'Admin',
  password: 'ManUtd7'
} as const;

// Valid roles for Supabase users
const VALID_USER_ROLES = ['customer', 'driver', 'partner'] as const;
type ValidUserRole = typeof VALID_USER_ROLES[number];

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'adera-hermes-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if it's the hardcoded admin
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Admin login successful
      const token = sign(
        {
          userId: 'admin',
          username: ADMIN_CREDENTIALS.username,
          role: 'admin',
          email: 'admin@adera-bot.com'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          username: ADMIN_CREDENTIALS.username,
          role: 'admin',
          email: 'admin@adera-bot.com'
        },
        token
      });
    }

    // #region agent log
    const log = (msg: string, data: Record<string, unknown>) => {
      const payload = { location: 'api/auth/login/route.ts', message: msg, data: { ...data, timestamp: Date.now(), sessionId: 'debug-session' } };
      fetch('http://127.0.0.1:7242/ingest/0c548119-b428-4614-92e0-026b8bcb02ed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
    };
    log('login attempt', { hypothesisId: 'A', inputUname: username, hasPassword: !!password });
    // #endregion

    // Check against Supabase users table for regular users
    // Try to find user by email first (handles special chars); fallback to username
    let user: Record<string, unknown> | null = null;
    let error: { message?: string; code?: string; details?: string } | null = null;

    if (username.includes('@')) {
      const res = await supabaseServer.from('users').select('*').eq('email', username).maybeSingle();
      user = res.data as Record<string, unknown> | null;
      error = res.error as { message?: string; code?: string; details?: string } | null;
      // #region agent log
      log('supabase by email', { hypothesisId: 'B', found: !!user, errorMsg: error?.message, errorCode: error?.code, userKeys: user ? Object.keys(user) : [] });
      // #endregion
    }
    if (!user && !error) {
      const res = await supabaseServer.from('users').select('*').eq('username', username).maybeSingle();
      user = res.data as Record<string, unknown> | null;
      error = res.error as { message?: string; code?: string; details?: string } | null;
      // #region agent log
      log('supabase by username', { hypothesisId: 'C', found: !!user, errorMsg: error?.message, userKeys: user ? Object.keys(user) : [] });
      // #endregion
    }

    if (error || !user) {
      // #region agent log
      log('login reject no user', { hypothesisId: 'D', errorMsg: error?.message, errorCode: error?.code });
      // #endregion
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Validate that user has an allowed role
    if (!user.role || !VALID_USER_ROLES.includes(user.role as ValidUserRole)) {
      return NextResponse.json(
        { error: 'Access denied. Your account does not have access to this service.' },
        { status: 403 }
      );
    }

    const storedPassword = user.password as string | undefined;
    let passwordMatch = storedPassword !== undefined && storedPassword === password;

    // If public.users has no password column, verify via Supabase Auth (auth.users)
    if (!passwordMatch && storedPassword === undefined && username.includes('@')) {
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: username,
        password,
      });
      // #region agent log
      log('auth signInWithPassword', { hypothesisId: 'F', authOk: !!authData?.user, authError: authError?.message });
      // #endregion
      passwordMatch = !authError && !!authData?.user;
    }

    // #region agent log
    log('password check', { hypothesisId: 'E', hasStoredPassword: storedPassword !== undefined, passwordMatch });
    // #endregion

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // User login successful – use profile fields for display (table has first_name, last_name, not username)
    const userId = user.id as string;
    const userEmail = (user.email as string) || username;
    const userRole = user.role as string;
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      (user.username as string) ||
      userEmail;

    const token = sign(
      { userId, username: displayName, role: userRole, email: userEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      user: { id: userId, username: displayName, role: userRole, email: userEmail },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
