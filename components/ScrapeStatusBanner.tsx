'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ScrapeRun } from '@/lib/types'

interface Props {
  onRunCompleted?: () => void
}

const POLL_INTERVAL_RUNNING = 3000
const POLL_INTERVAL_IDLE    = 15000

export function ScrapeStatusBanner({ onRunCompleted }: Props) {
  const [run,      setRun]      = useState<(ScrapeRun & { status: string }) | null>(null)
  const [expanded, setExpanded] = useState(false)
  const prevStatus              = useRef<string | null>(null)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  const poll = async () => {
    try {
      const res  = await fetch('/api/scrape-status')
      const data = await res.json()

      if (data.status === 'idle' || !data.id) {
        setRun(null)
      } else {
        setRun(data)

        // Fire callback when a run transitions from running → done/failed
        if (prevStatus.current === 'running' && data.status !== 'running') {
          onRunCompleted?.()
        }
        prevStatus.current = data.status
      }

      const interval = data.status === 'running' ? POLL_INTERVAL_RUNNING : POLL_INTERVAL_IDLE
      timerRef.current = setTimeout(poll, interval)
    } catch {
      timerRef.current = setTimeout(poll, POLL_INTERVAL_IDLE)
    }
  }

  useEffect(() => {
    poll()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!run) return null

  const isRunning = run.status === 'running'
  const isDone    = run.status === 'done'
  const isFailed  = run.status === 'failed'

  const borderColor = isRunning ? 'border-blue-500/40'  :
                      isDone    ? 'border-green-500/40' :
                                  'border-red-500/40'
  const bgColor     = isRunning ? 'bg-blue-500/5'   :
                      isDone    ? 'bg-green-500/5'  :
                                  'bg-red-500/5'
  const textColor   = isRunning ? 'text-blue-600'   :
                      isDone    ? 'text-green-600'  :
                                  'text-red-600'

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} px-4 py-3 text-sm`}>
      <div className="flex items-center gap-2">
        {/* Icon */}
        {isRunning && <Loader2 size={15} className={`${textColor} animate-spin shrink-0`} />}
        {isDone    && <CheckCircle2 size={15} className={`${textColor} shrink-0`} />}
        {isFailed  && <XCircle     size={15} className={`${textColor} shrink-0`} />}

        {/* Current step */}
        <span className={`${textColor} font-medium flex-1 truncate`}>
          {run.current_step ?? (isRunning ? 'Running…' : run.status)}
        </span>

        {/* Timestamp */}
        <span className="text-muted-foreground text-xs shrink-0">
          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
        </span>

        {/* Expand toggle — only show if there are steps */}
        {(run.steps_log?.length ?? 0) > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Expanded step log */}
      {expanded && run.steps_log?.length > 0 && (
        <div className="mt-2 pl-5 space-y-0.5 border-t border-border/50 pt-2">
          {run.steps_log.map((s, i) => (
            <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-green-500">✓</span> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
