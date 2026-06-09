'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CinematicTransition } from '@/components/ui/cinematic-transition'

// ── Inner component (needs Suspense because of useSearchParams) ────────────

function TransitionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)

  // Accept both URL param (server-action redirect) and sessionStorage flag
  const source =
    searchParams.get('source') ??
    (typeof window !== 'undefined' ? sessionStorage.getItem('show_intro') : null)

  useEffect(() => {
    if (!source) {
      router.replace('/planning')
      return
    }
    setReady(true)
  }, [source, router])

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('show_intro')
    }
    if (source === 'onboarding') {
      router.push('/agenda')
    } else {
      router.push('/planning')
    }
  }

  if (!ready) return null

  return <CinematicTransition onComplete={handleComplete} skippable />
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TransitionPage() {
  return (
    <Suspense>
      <TransitionContent />
    </Suspense>
  )
}
