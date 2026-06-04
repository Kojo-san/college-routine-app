'use client'

import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { TaskForm } from './TaskForm'

interface TaskSectionProps {
  courseId: string
  taskCount: number
  children: ReactNode
}

export function TaskSection({ courseId, taskCount, children }: TaskSectionProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne text-[18px] font-bold text-text-primary">
          Tâches à faire
          {taskCount > 0 && (
            <span className="font-space-grotesk text-[13px] font-normal text-text-muted ml-2">
              {taskCount}
            </span>
          )}
        </h2>
        {!formOpen && (
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            Ajouter une Tâche
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mb-4">
          <TaskForm courseId={courseId} onClose={() => setFormOpen(false)} />
        </div>
      )}

      {children}
    </section>
  )
}
