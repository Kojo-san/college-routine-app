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
        'flex-shrink-0 flex items-center justify-center',
        'w-7 h-7 rounded transition-all duration-150 focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        step === 'idle'
          ? 'opacity-0 group-hover:opacity-100 hover:bg-bg-elevated'
          : '',
      ].join(' ')}
      style={{
        color: step === 'confirm' ? 'var(--color-accent-reco)' : 'var(--color-text-muted)',
      }}
    >
      {step === 'loading' ? (
        <span className="font-space-grotesk text-[11px]">…</span>
      ) : step === 'confirm' ? (
        <span className="font-space-grotesk text-[10px] font-semibold">ok?</span>
      ) : (
        <TrashIcon />
      )}
    </button>
  )
}
