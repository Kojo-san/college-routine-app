'use client'

import { useSearchParams } from 'next/navigation'

interface GoogleCalendarButtonProps {
  connected?: boolean
}

export function GoogleCalendarButton({ connected = false }: GoogleCalendarButtonProps) {
  const searchParams = useSearchParams()
  const justConnected = searchParams.get('gcal_connected') === '1'
  const error = searchParams.get('gcal_error')

  const isConnected = connected || justConnected

  async function pushToCalendar() {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch('/api/calendar/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today }),
    })
    const json = await res.json()
    if (res.ok) {
      alert(`${json.data.pushed} bloc${json.data.pushed !== 1 ? 's' : ''} exporté${json.data.pushed !== 1 ? 's' : ''} vers Google Agenda.`)
    } else if (json.code === 'NOT_CONNECTED') {
      window.location.href = '/api/auth/google'
    } else {
      alert(json.error ?? 'Erreur export calendrier')
    }
  }

  if (error) {
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

  return (
    <button
      type="button"
      onClick={pushToCalendar}
      className="inline-flex items-center gap-2 font-space-grotesk text-[12px] font-medium px-3 py-2 rounded-lg border"
      style={{
        borderColor: 'var(--color-accent-study)',
        background: 'rgba(74,158,255,0.08)',
        color: 'var(--color-accent-study)',
        cursor: 'pointer',
      }}
    >
      Exporter vers Google Agenda
    </button>
  )
}
