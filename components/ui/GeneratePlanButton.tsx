'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from './Button'
import { parseApiError } from '@/lib/errors'

interface GeneratePlanButtonProps {
  label?: string
}

export function GeneratePlanButton({ label = 'Générer le Planning' }: GeneratePlanButtonProps) {
  const router = useRouter()
  const [status, setStatus]   = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGenerate() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/planning/generate', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(parseApiError(body, res.status))
      }
      router.refresh()
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleGenerate} disabled={status === 'loading'}>
        {status === 'loading' ? 'Génération…' : label}
      </Button>
      {status === 'error' && (
        <p
          role="alert"
          className="font-space-grotesk text-[12px] max-w-xs leading-relaxed"
          style={{ color: 'var(--color-accent-reco)' }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  )
}
