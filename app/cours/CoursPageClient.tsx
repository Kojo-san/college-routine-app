'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CourseCard } from '@/components/ui/CourseCard'
import { CourseForm } from '@/components/ui/CourseForm'
import type { CourseWithStats } from '@/lib/courses'

function BookIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-40">
      <path
        d="M12 6c-1.8-1.3-4.2-2-6.5-2A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 1 5.5 15c2.3 0 4.7.7 6.5 2m0-11c1.8-1.3 4.2-2 6.5-2A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 0-2.5-2.5c-2.3 0-4.7.7-6.5 2m0-11v11"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CoursPageClient({ courses }: { courses: CourseWithStats[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const isEmpty = courses.length === 0

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* ── Header : compteur + bouton d'ajout (masqué en empty state) ── */}
      {!isEmpty && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="font-space-grotesk text-[13px] text-text-muted">
            {courses.length} cours ce semestre
          </p>
          {!formOpen && (
            <Button variant="secondary" onClick={() => setFormOpen(true)}>
              + Ajouter un cours
            </Button>
          )}
        </div>
      )}

      {/* ── Formulaire de création ── */}
      <CourseForm open={formOpen} onOpenChange={setFormOpen} />

      {/* ── Empty state ── */}
      {isEmpty && !formOpen && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <BookIcon />
          <h2 className="font-syne text-[20px] font-bold text-text-primary">
            Aucun cours pour ce semestre
          </h2>
          <p className="font-space-grotesk text-[14px] text-text-muted max-w-xs leading-relaxed">
            Commence par ajouter tes cours pour organiser ton semestre.
          </p>
          <Button variant="primary" onClick={() => setFormOpen(true)} className="mt-2">
            + Ajouter un cours
          </Button>
        </div>
      )}

      {/* ── Grille des cours ── */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      )}

    </div>
  )
}
