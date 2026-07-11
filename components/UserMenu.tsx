'use client'

import { UserButton } from '@clerk/nextjs'

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2 pl-1" title={email || undefined}>
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'size-9',
          },
        }}
      />
    </div>
  )
}
