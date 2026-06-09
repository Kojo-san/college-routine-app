'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SpiralAnimation } from '@/components/ui/spiral-animation'

interface CinematicTransitionProps {
  onComplete: () => void
  skippable?: boolean
}

export function CinematicTransition({
  onComplete,
  skippable = true,
}: CinematicTransitionProps) {
  const [fading, setFading] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const calledRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep onComplete ref fresh without re-triggering effects
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Fade out 600 ms then call onComplete — idempotent
  const triggerComplete = useCallback(() => {
    if (calledRef.current) return
    calledRef.current = true
    setFading(true)
    fadeTimerRef.current = setTimeout(() => {
      onCompleteRef.current()
    }, 600)
  }, [])

  // ── Step 6: Performance safeguard — skip animation on <30 fps ─────────────
  useEffect(() => {
    let rafId: number
    let frameCount = 0
    let startTs: number | null = null

    const measure = (ts: number) => {
      if (startTs === null) startTs = ts
      frameCount++

      if (frameCount >= 30) {
        const fps = (frameCount / (ts - startTs)) * 1000
        if (fps < 30) {
          triggerComplete()
        }
        return // stop measuring either way
      }

      rafId = requestAnimationFrame(measure)
    }

    rafId = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafId)
  }, [triggerComplete])

  // ── Auto-complete after one full bear flight sequence (~5 s) ──────────────
  useEffect(() => {
    const t = setTimeout(triggerComplete, 5000)
    return () => clearTimeout(t)
  }, [triggerComplete])

  // ── Show skip button after 1.5 s ──────────────────────────────────────────
  useEffect(() => {
    if (!skippable) return
    const t = setTimeout(() => setShowSkip(true), 1500)
    return () => clearTimeout(t)
  }, [skippable])

  // Cleanup fade timer on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 600ms ease-out' : 'none',
      }}
    >
      <SpiralAnimation className="absolute inset-0 w-full h-full" />

      {showSkip && (
        <button
          onClick={triggerComplete}
          className="absolute bottom-8 right-8 px-5 py-2 rounded-full font-space-grotesk text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
        >
          Passer →
        </button>
      )}
    </div>
  )
}
