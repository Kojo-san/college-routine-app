'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ToggleCompletedButtonProps {
  goalId: string
  completed: boolean
}

export function ToggleCompletedButton({ goalId, completed }: ToggleCompletedButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      await fetch(`/api/objectifs/${goalId}/complete`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={completed ? 'Marquer comme en cours' : 'Marquer comme atteint'}
      className="focus-ring rounded flex items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span
        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150 flex-shrink-0"
        style={{
          borderColor: completed ? 'var(--color-accent-rec)' : 'var(--color-border-subtle)',
          backgroundColor: completed ? 'var(--color-accent-rec)' : 'transparent',
        }}
        aria-hidden="true"
      >
        {completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span
        className="font-space-grotesk text-[12px] font-medium transition-colors duration-150"
        style={{ color: completed ? 'var(--color-accent-rec)' : 'var(--color-text-muted)' }}
      >
        {loading ? '…' : completed ? 'Atteint' : 'Marquer comme atteint'}
      </span>
    </button>
  )
}
