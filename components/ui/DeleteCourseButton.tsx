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
        'font-space-grotesk text-[13px] transition-colors duration-150 focus-ring rounded-lg px-3 py-1.5',
        'border disabled:opacity-40 disabled:cursor-not-allowed',
        step === 'confirm'
          ? 'border-accent-reco/60 text-accent-reco'
          : 'border-accent-reco/30 text-accent-reco/60 hover:text-accent-reco hover:border-accent-reco/60',
      ].join(' ')}
    >
      {step === 'loading'
        ? 'Suppression…'
        : step === 'confirm'
        ? '⚠ Confirmer la suppression'
        : 'Supprimer ce cours'}
    </button>
  )
}
