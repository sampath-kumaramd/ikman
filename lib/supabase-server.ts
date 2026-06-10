import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Cookie-bound Supabase client for Server Components and Route Handlers.
 * Used only for auth (who is the current user) — data access goes through
 * the admin client in lib/supabase.ts.
 */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set')

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — session refresh is handled by proxy.ts
        }
      },
    },
  })
}

/** Current authenticated user, or null. */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
