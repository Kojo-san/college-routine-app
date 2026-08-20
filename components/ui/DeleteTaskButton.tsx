'use client'

import { useRouter } from 'next/navigation'
import { useState, type MouseEvent } from 'react'

interface DeleteTaskButtonProps {
  taskId: string
  courseId: string
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h9M5.5 4V2.5h3V4M3 4l.75 7.5h6.5L11 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DeleteTaskButton({ taskId, courseId }: DeleteTaskButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (step === 'idle') { setStep('confirm'); return }
    setStep('loading')
    fetch(`/api/cours/${courseId}/tasks/${taskId}`, { method: 'DELETE' })
      .then(() => router.refresh())
      .catch(() => setStep('idle'))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => { if (step === 'confirm') setStep('idle') }}
      disabled={step === 'loading'}
      aria-label={step === 'confirm' ? 'Confirmer la suppression' : 'Supprimer la tâche'}
      className={[
        // 44px hit target for touch/WCAG, but no visible box at that size —
        // only the inner chip below shows the hover background, so the
        // affordance doesn't visually balloon inside a dense task row.
        'flex-shrink-0 flex items-center justify-center',
        'w-11 h-11 rounded transition-opacity duration-150 focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        step === 'idle' ? 'hover-reveal' : '',
      ].join(' ')}
      style={{
        color: step === 'confirm' ? 'var(--color-accent-reco)' : 'var(--color-text-muted)',
      }}
    >
      <span className="w-7 h-7 rounded flex items-center justify-center hover:bg-bg-elevated transition-colors duration-150">
        {step === 'loading' ? (
          <span className="font-space-grotesk text-[11px]">…</span>
        ) : step === 'confirm' ? (
          <span className="font-space-grotesk text-[10px] font-semibold">ok?</span>
        ) : (
          <TrashIcon />
        )}
      </span>
    </button>
  )
}
