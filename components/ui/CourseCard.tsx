import Link from 'next/link'
import { DeadlineChip } from './DeadlineChip'
import type { DeadlineState } from './DeadlineChip'
import { hashCourseColor } from '@/lib/courseColor'

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
  courseHours?: number
  labHours?: number
  personalHours?: number
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

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="flex-shrink-0">
      <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8.5h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CourseCard({
  id, code, name, taskCount, deadlines,
  courseHours = 0, labHours = 0, personalHours = 0,
}: CourseCardProps) {
  const upcomingDeadlines = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 2)

  const accentColor = hashCourseColor(code || name)
  const tripletParts = [
    courseHours > 0 ? `${courseHours}h cours` : null,
    labHours > 0 ? `${labHours}h lab` : null,
    personalHours > 0 ? `${personalHours}h perso` : null,
  ].filter(Boolean)

  return (
    <Link
      href={`/cours/${id}`}
      className="course-card block bg-bg-surface border border-border-subtle rounded-xl p-4 focus-ring"
      style={{
        '--course-accent': accentColor,
        '--course-accent-dim': `${accentColor}66`,
      } as React.CSSProperties}
    >
      {/* Sigle */}
      <span
        className="block font-space-grotesk text-[11px] font-semibold tracking-[0.1em] uppercase"
        style={{ color: '#ffffff50' }}
      >
        {code}
      </span>

      {/* Name */}
      <p className="font-syne text-[16px] font-semibold text-white mt-1 mb-3">{name}</p>

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
        <p className="flex items-center gap-1.5 font-space-grotesk text-[12px]" style={{ color: '#ffffff35' }}>
          <CalendarIcon />
          Pas d&apos;échéance
        </p>
      )}

      {/* Triplet horaire */}
      {tripletParts.length > 0 && (
        <p
          className="font-space-grotesk mt-3 pt-3 border-t border-white/5"
          style={{ color: '#ffffff40', fontSize: '12px' }}
        >
          {tripletParts.join(' · ')}
        </p>
      )}
    </Link>
  )
}
