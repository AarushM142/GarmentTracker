import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Login Rate Limiting ────────────────────────────────────────────────────
// In-process store: IP → { count, windowStart }
// Resets after WINDOW_MS. Replace Map with Upstash Redis when scaling horizontally.
const loginAttempts = new Map<string, { count: number; windowStart: number }>()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now - record.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now })
    return false
  }

  record.count += 1
  return record.count > MAX_ATTEMPTS
}
// ────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // Rate-limit POST /login before doing anything else
  if (request.method === 'POST' && request.nextUrl.pathname === '/login') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Please wait 5 minutes.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '300' } }
      )
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname.startsWith('/login')
  const isRoot = url.pathname === '/'

  function roleHome(role: string): string {
    switch (role) {
      case 'super_admin':
      case 'director':
        return '/director'
      case 'production_head':
      case 'production_coordinator':
        return '/planner'
      case 'production_supervisor':
      case 'cutting_master':
        return '/floor'
      case 'store_manager':
        return '/inventory'
      case 'accounts_manager':
        return '/accounts'
      default:
        return '/floor'
    }
  }

  if (!user && !isAuthPage && !url.pathname.startsWith('/auth')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (isAuthPage || isRoot)) {
    const role = user.user_metadata?.role || 'floor'
    url.pathname = roleHome(role)
    url.search = '' // Clear query params (e.g. ?message=...)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
