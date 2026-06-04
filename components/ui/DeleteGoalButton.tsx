'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteGoalButtonProps {
  goalId: string
}

export function DeleteGoalButton({ goalId }: DeleteGoalButtonProps) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function handleClick() {
    if (step === 'idle') { setStep('confirm'); return }
    setStep('loading')
    try {
      await fetch(`/api/objectifs/${goalId}`, { method: 'DELETE' })
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
      className="font-space-grotesk text-[12px] transition-colors duration-150 focus-ring rounded disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: step === 'confirm' ? 'var(--color-accent-reco)' : 'var(--color-text-muted)' }}
    >
      {step === 'loading'
        ? '…'
        : step === 'confirm'
        ? '⚠ Confirmer ?'
        : 'Supprimer'}
    </button>
  )
}
