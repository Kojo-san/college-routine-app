'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useModalA11y } from '@/lib/useModalA11y'
import { Button } from './Button'

interface DeleteCourseButtonProps {
  courseId: string
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useModalA11y<HTMLDivElement>(open, () => { if (!loading) setOpen(false) })

  async function handleDelete() {
    setLoading(true)
    try {
      await fetch(`/api/cours/${courseId}`, { method: 'DELETE' })
      router.push('/cours')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Supprimer ce cours
      </Button>

      {open && (
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-course-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm outline-none"
          onClick={() => { if (!loading) setOpen(false) }}
        >
          <div
            className="bg-bg-surface border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-course-title" className="font-syne text-[18px] font-bold text-text-primary">
              Supprimer ce cours ?
            </h2>
            <p className="font-space-grotesk text-[14px] text-text-muted leading-relaxed">
              Cette action supprimera définitivement le cours ainsi que toutes ses tâches et
              échéances associées. Il sera également retiré de ta grille horaire dans l&apos;agenda.
            </p>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                {loading ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
