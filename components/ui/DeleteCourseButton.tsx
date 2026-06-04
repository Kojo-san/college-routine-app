'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteCourseButtonProps {
  courseId: string
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function handleClick() {
    if (step === 'idle') { setStep('confirm'); return }
    setStep('loading')
    try {
      await fetch(`/api/academique/${courseId}`, { method: 'DELETE' })
      router.push('/academique')
      router.refresh()
    } catch {
      setStep('idle')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => { if (step === 'confirm') setStep('idle') }}
      disabled={step === 'loading'}
      className={[
        'font-space-grotesk text-[13px] transition-colors duration-150 focus-ring rounded',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      ].join(' ')}
      style={{ color: step === 'confirm' ? 'var(--color-accent-reco)' : 'var(--color-text-muted)' }}
    >
      {step === 'loading'
        ? 'Suppression…'
        : step === 'confirm'
        ? '⚠ Confirmer la suppression'
        : 'Supprimer ce cours'}
    </button>
  )
}
