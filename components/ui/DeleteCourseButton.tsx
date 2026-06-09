'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteCourseButtonProps {
  courseId: string
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-space-grotesk text-[13px] transition-colors duration-150 focus-ring rounded-lg px-3 py-1.5 border border-accent-reco/30 text-accent-reco/60 hover:text-accent-reco hover:border-accent-reco/60"
      >
        Supprimer ce cours
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { if (!loading) setOpen(false) }}
        >
          <div
            className="bg-bg-surface border border-border-subtle rounded-xl p-6 max-w-md w-full mx-4 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-syne text-[18px] font-bold text-text-primary">
              Supprimer ce cours ?
            </h2>
            <p className="font-space-grotesk text-[14px] text-text-muted leading-relaxed">
              Cette action supprimera définitivement le cours ainsi que toutes ses tâches et
              échéances associées. Il sera également retiré de ta grille horaire dans l&apos;agenda.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="font-space-grotesk text-[13px] px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-muted transition-colors duration-150 focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="font-space-grotesk text-[13px] px-4 py-2 rounded-lg bg-accent-reco text-white hover:opacity-90 transition-opacity duration-150 focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
