'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { DeadlineChip, type DeadlineState } from './DeadlineChip'
import { DeadlineEditModal } from './DeadlineEditModal'
import { Button } from './Button'

interface DeadlineItemProps {
  id: string
  courseId: string
  title: string
  dueDate: Date
  weight: number | null
  completed: boolean
}

function getDeadlineState(dueDate: Date, completed: boolean): DeadlineState {
  if (completed) return 'done'
  const daysLeft = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft <= 5 ? 'urgent' : 'normal'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function DeadlineItem({ id, courseId, title, dueDate, weight, completed }: DeadlineItemProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/cours/${courseId}/deadlines/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-between bg-bg-surface border border-accent-reco/30 rounded-xl px-4 py-3">
        <span className="font-space-grotesk text-[13px] text-text-primary">
          Supprimer cette échéance ?
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center justify-between bg-bg-surface border border-border-subtle rounded-xl px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-space-grotesk text-[14px] font-medium text-text-primary">
          {title}
        </span>
        <span className="font-space-grotesk text-[12px] text-text-muted">
          {formatDate(dueDate)}{weight != null ? ` · ${weight}%` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <DeadlineChip
          state={getDeadlineState(dueDate, completed)}
          label={completed ? 'Complété' : formatDate(dueDate)}
        />
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Modifier l'échéance"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded transition-opacity duration-150 focus-ring hover-reveal text-text-muted"
        >
          <span className="w-7 h-7 rounded flex items-center justify-center hover:bg-bg-elevated hover:text-text-primary transition-colors duration-150">
            <Pencil size={13} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Supprimer l'échéance"
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded transition-opacity duration-150 focus-ring hover-reveal text-text-muted"
        >
          <span className="w-7 h-7 rounded flex items-center justify-center hover:bg-bg-elevated hover:text-accent-reco transition-colors duration-150">
            <Trash2 size={13} />
          </span>
        </button>
      </div>

      {editOpen && (
        <DeadlineEditModal
          courseId={courseId}
          deadlineId={id}
          title={title}
          dueDate={dueDate}
          weight={weight}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh() }}
        />
      )}
    </div>
  )
}
