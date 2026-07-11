'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Send, Unlink, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { track } from '@/lib/analytics'

interface TelegramConnectProps {
  /** Show test-message + unlink controls (settings page). */
  manage?: boolean
  onStatusChange?: (connected: boolean) => void
}

export function TelegramConnect({ manage = false, onStatusChange }: TelegramConnectProps) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/telegram/connect')
      const data = await res.json()
      const isConnected = !!data.connected
      setConnected(isConnected)
      onStatusChange?.(isConnected)
      return isConnected
    } catch {
      return false
    }
  }, [onStatusChange])

  useEffect(() => {
    const t = setTimeout(checkStatus, 0)
    return () => {
      clearTimeout(t)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [checkStatus])

  // While a connect link is shown, poll until the user presses Start in Telegram
  useEffect(() => {
    if (!link || connected) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(async () => {
      const ok = await checkStatus()
      if (ok && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
        track('telegram_connected')
      }
    }, 3000)
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [link, connected, checkStatus])

  async function startConnect() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.link) throw new Error(data.error ?? 'Could not create connect link')
      setLink(data.link)
      track('telegram_connect_started')
      window.open(data.link, '_blank', 'noopener')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    setBusy(true)
    try {
      await fetch('/api/telegram/connect', { method: 'DELETE' })
      setLink(null)
      setConnected(false)
      onStatusChange?.(false)
      track('telegram_unlinked')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' })
      const data = await res.json()
      if (data.ok) track('telegram_test_sent')
      setTestResult({ ok: data.ok, message: data.message ?? data.error ?? 'Unknown error' })
    } catch {
      setTestResult({ ok: false, message: 'Request failed — is the server running?' })
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 6000)
    }
  }

  if (connected === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 size={15} className="animate-spin" /> Checking Telegram connection…
      </div>
    )
  }

  if (connected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600 dark:text-emerald-400" />
          <span className="text-sm font-medium dark:text-white">Telegram connected</span>
          <Badge variant="secondary" className="dark:bg-emerald-500/15 dark:text-emerald-300">alerts active</Badge>
        </div>
        {manage && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button type="button" variant="outline" size="sm" disabled={testing} onClick={sendTest}>
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {testing ? 'Sending…' : 'Send test message'}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={unlink}>
              <Unlink size={14} /> Unlink
            </Button>
            {testResult && (
              <span className={`flex items-center gap-1.5 text-sm ${testResult.ok ? 'text-green-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {testResult.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {testResult.message}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect your Telegram account to get an instant message whenever a new
        listing matches your search. Click the button, then press <b>Start</b> in
        the Telegram chat that opens.
      </p>

      {link ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            Waiting for you to press <b>Start</b> in Telegram…
          </div>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
          >
            <ExternalLink size={14} /> Open Telegram again
          </a>
        </div>
      ) : (
        <Button
          type="button"
          onClick={startConnect}
          disabled={busy}
          className="dark:bg-sky-500 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:hover:bg-sky-400"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Connect Telegram
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
