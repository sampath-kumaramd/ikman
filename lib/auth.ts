import { auth, currentUser } from '@clerk/nextjs/server'

/** Minimal app user shape (Clerk id + primary email). */
export interface AuthUser {
  id: string
  email: string | null
}

/** Clerk user id, or null if signed out. */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/** Current signed-in user, or null. Prefer this over Supabase Auth. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await currentUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
      ?? user.emailAddresses[0]?.emailAddress
      ?? null,
  }
}
