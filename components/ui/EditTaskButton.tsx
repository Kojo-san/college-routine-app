'use client'

import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { TaskEditModal } from './TaskEditModal'

interface EditTaskButtonProps {
  taskId: string
  courseId: string
  title: string
  description: string | null
  estimatedDurationMinutes: number
}

export function EditTaskButton({ taskId, courseId, title, description, estimatedDurationMinutes }: EditTaskButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Modifier la tâche"
        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded transition-opacity duration-150 focus-ring hover-reveal text-text-muted"
      >
        <span className="w-7 h-7 rounded flex items-center justify-center hover:bg-bg-elevated hover:text-text-primary transition-colors duration-150">
          <Pencil size={13} />
        </span>
      </button>

      {open && (
        <TaskEditModal
          courseId={courseId}
          taskId={taskId}
          title={title}
          description={description}
          estimatedDurationMinutes={estimatedDurationMinutes}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
