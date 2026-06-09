import Link from 'next/link'
import { DeadlineChip } from './DeadlineChip'
import type { DeadlineState } from './DeadlineChip'

interface DeadlinePreview {
  id: string
  title: string
  dueDate: Date
  weight: number
  completed: boolean
}

interface CourseCardProps {
  id: string
  code: string
  name: string
  taskCount: number
  deadlines: DeadlinePreview[]
}

function getDeadlineState(dueDate: Date, completed: boolean): DeadlineState {
  if (completed) return 'done'
  const daysLeft = (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft <= 5 ? 'urgent' : 'normal'
}

function formatDaysLeft(dueDate: Date): string {
  const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return days <= 0 ? "Aujourd'hui" : `Dans ${days} jour${days > 1 ? 's' : ''}`
}

export function CourseCard({ id, code, name, taskCount, deadlines }: CourseCardProps) {
  const upcomingDeadlines = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 2)

  return (
    <Link
      href={`/cours/${id}`}
      className="block bg-bg-surface border border-border-subtle rounded-xl p-4 hover:border-accent-study/50 transition-colors focus-ring"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <span className="font-space-grotesk text-[11px] font-semibold tracking-[0.1em] uppercase text-text-muted">
          {code}
        </span>
      </div>

      {/* Name */}
      <p className="font-syne text-[16px] font-bold text-text-primary mt-1 mb-3">{name}</p>

      {/* Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {upcomingDeadlines.map((d) => (
            <DeadlineChip
              key={d.id}
              state={getDeadlineState(d.dueDate, d.completed)}
              label={`${d.title} · ${formatDaysLeft(d.dueDate)} · ${d.weight}%`}
            />
          ))}
        </div>
      )}

      {/* Task count */}
      {taskCount > 0 && (
        <p className="font-space-grotesk text-[12px] text-text-muted">
          {taskCount} tâche{taskCount > 1 ? 's' : ''} en cours
        </p>
      )}

      {/* Fallback quand la carte est vide */}
      {upcomingDeadlines.length === 0 && taskCount === 0 && (
        <p className="font-space-grotesk text-[12px] text-text-muted">
          Aucune échéance
        </p>
      )}
    </Link>
  )
}
