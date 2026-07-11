import { redirect } from 'next/navigation'

/** Legacy route — Clerk lives at /sign-in */
export default function LoginRedirectPage() {
  redirect('/sign-in')
}
