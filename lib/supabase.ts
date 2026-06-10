import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — created only when first accessed, not at module load time.
// This prevents build-time errors when env vars are not available.

let _admin: SupabaseClient | null = null

/** Service-role client for server-side data access (bypasses RLS). */
export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set')
    _admin = createClient(url, key)
  }
  return _admin
}
