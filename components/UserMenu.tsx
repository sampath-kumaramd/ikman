'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleUser, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export function UserMenu({ email }: { email: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function signOut() {
    await getBrowserSupabase().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Account"
        onClick={() => setOpen((o) => !o)}
      >
        <CircleUser size={20} />
      </Button>

      {open && (
        <div className="glass absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl bg-[#0b0f1a]/80">
          <p className="px-4 py-3 text-sm text-muted-foreground truncate">{email}</p>
          <Separator />
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-white/[0.06] transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
