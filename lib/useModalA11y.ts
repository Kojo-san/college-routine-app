'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Wires a modal container for WCAG-compliant dialog behavior: locks body
 * scroll, moves focus in on open, traps Tab/Shift+Tab inside, closes on
 * Escape, and restores focus to the trigger on close.
 */
export function useModalA11y<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    const initialFocusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0]
    ;(initialFocusable ?? container)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !container) return

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
    }
  }, [open])

  return containerRef
}
