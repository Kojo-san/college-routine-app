'use client'

import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { DeadlineForm } from './DeadlineForm'

interface DeadlineSectionProps {
  courseId: string
  children: ReactNode
}

export function DeadlineSection({ courseId, children }: DeadlineSectionProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne text-[18px] font-bold text-text-primary">Échéances</h2>
        {!formOpen && (
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            Ajouter une Échéance
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mb-4">
          <DeadlineForm courseId={courseId} onClose={() => setFormOpen(false)} />
        </div>
      )}

      {children}
    </section>
  )
}
