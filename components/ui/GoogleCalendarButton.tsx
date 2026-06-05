'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

type PushStatus =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; count: number }
  | { type: 'error'; message: string }

interface GoogleCalendarButtonProps {
  connected?: boolean
}

export function GoogleCalendarButton({ connected = false }: GoogleCalendarButtonProps) {
  const searchParams   = useSearchParams()
  const justConnected  = searchParams.get('gcal_connected') === '1'
  const gcalError      = searchParams.get('gcal_error')

  const isConnected = connected || justConnected

  const [status, setStatus] = useState<PushStatus>({ type: 'idle' })

  async function pushToCalendar() {
    setStatus({ type: 'loading' })
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch('/api/calendar/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      })

      const json: unknown = await res.json().catch(() => null)

      if (res.ok) {
        const pushed = (json as { data: { pushed: number } }).data.pushed
        setStatus({ type: 'success', count: pushed })
        setTimeout(() => setStatus({ type: 'idle' }), 5000)
        return
      }

      const body = json as { code?: string; error?: string } | null
      if (body?.code === 'NOT_CONNECTED') {
        window.location.href = '/api/auth/google'
        return
      }
      setStatus({
        type: 'error',
        message: body?.error ?? 'Erreur export calendrier',
      })
    } catch {
      setStatus({ type: 'error', message: 'Erreur réseau — réessayez' })
    }
  }

  if (gcalError) {
    return (
      <p
        className="font-space-grotesk text-[12px] px-3 py-2 rounded-lg"
        style={{ color: 'var(--color-accent-reco)', background: 'rgba(255,107,157,0.08)' }}
      >
        Connexion Google refusée.
      </p>
    )
  }

  if (!isConnected) {
    return (
      <a
        href="/api/auth/google"
        className="inline-flex items-center gap-2 font-space-grotesk text-[12px] font-medium px-3 py-2 rounded-lg border"
        style={{
          borderColor: 'var(--color-border-subtle)',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
        }}
      >
        Connecter Google Agenda
      </a>
    )
  }

  if (status.type === 'success') {
    return (
      <p
        className="font-space-grotesk text-[12px] px-3 py-2 rounded-lg"
        style={{ color: 'var(--color-accent-study)', background: 'rgba(74,158,255,0.08)' }}
      >
        ✓ {status.count} bloc{status.count !== 1 ? 's' : ''} exporté{status.count !== 1 ? 's' : ''} vers Google Agenda
      </p>
    )
  }

  if (status.type === 'error') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <p
          className="font-space-grotesk text-[12px] px-3 py-2 rounded-lg"
          style={{ color: 'var(--color-accent-reco)', background: 'rgba(255,107,157,0.08)' }}
        >
          ✕ {status.message}
        </p>
        <button
          type="button"
          onClick={() => setStatus({ type: 'idle' })}
          className="font-space-grotesk text-[11px] text-text-muted underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={pushToCalendar}
      disabled={status.type === 'loading'}
      className="inline-flex items-center gap-2 font-space-grotesk text-[12px] font-medium px-3 py-2 rounded-lg border"
      style={{
        borderColor: 'var(--color-accent-study)',
        background: 'rgba(74,158,255,0.08)',
        color: 'var(--color-accent-study)',
        cursor: status.type === 'loading' ? 'wait' : 'pointer',
        opacity: status.type === 'loading' ? 0.7 : 1,
      }}
    >
      {status.type === 'loading' ? 'Export en cours…' : 'Exporter vers Google Agenda'}
    </button>
  )
}
