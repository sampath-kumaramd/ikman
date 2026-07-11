import { redirect } from 'next/navigation'

/** Password recovery is handled by Clerk (account settings / forgot password). */
export default function ResetPasswordRedirectPage() {
  redirect('/sign-in')
}
