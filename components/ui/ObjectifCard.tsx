import { Badge } from './Badge'
import { ScoreGauge } from './ScoreGauge'
import { ToggleCompletedButton } from './ToggleCompletedButton'
import { DeleteGoalButton } from './DeleteGoalButton'
import type { GoalSummary } from '@/lib/goals'
import type { GaugeAccent } from './ScoreGauge'

interface ObjectifCardProps {
  goal: GoalSummary
  today: Date
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-space-grotesk text-[11px] text-text-muted uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className="font-syne text-[20px] font-bold text-text-primary">
        {value}
      </span>
    </div>
  )
}

function calcTimeProgress(goal: GoalSummary, today: Date): number | undefined {
  if (goal.completed) return 100
  if (!goal.targetDate) return undefined
  const total = goal.targetDate.getTime() - goal.createdAt.getTime()
  if (total <= 0) return undefined
  const elapsed = today.getTime() - goal.createdAt.getTime()
  return Math.round(Math.max(0, Math.min(99, (elapsed / total) * 100)))
}

function formatTargetDate(date: Date): string {
  return date.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ObjectifCard({ goal, today }: ObjectifCardProps) {
  const progress    = calcTimeProgress(goal, today)
  const gaugeAccent: GaugeAccent = goal.type === 'ACADEMIC' ? 'study' : 'fitness'

  const hasAcademicStats = goal.type === 'ACADEMIC' && (goal.targetGpa != null || goal.targetGrade)
  const hasFitnessStats  = goal.type === 'FITNESS'  && (goal.targetWeight != null || goal.targetBodyFat != null || goal.targetStrength)
  const hasStats         = hasAcademicStats || hasFitnessStats

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <Badge variant={goal.type === 'ACADEMIC' ? 'study' : 'fitness'}>
          {goal.type === 'ACADEMIC' ? 'ACADÉMIQUE' : 'FITNESS'}
        </Badge>
        {goal.completed ? (
          <Badge variant="success" />
        ) : (goal.priority === 'HIGH' || goal.priority === 'CRITICAL') ? (
          <Badge variant="warning">{goal.priority}</Badge>
        ) : null}
      </div>

      {/* ── Title + description ── */}
      <div>
        <h3 className="font-syne text-[16px] font-bold text-text-primary leading-snug">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="font-space-grotesk text-[13px] text-text-muted mt-1.5 leading-relaxed">
            {goal.description}
          </p>
        )}
      </div>

      {/* ── Target stats ── */}
      {hasStats && (
        <div className="flex flex-wrap gap-6">
          {goal.type === 'ACADEMIC' && (
            <>
              {goal.targetGpa != null && (
                <Stat label="GPA cible" value={goal.targetGpa.toFixed(2)} />
              )}
              {goal.targetGrade && (
                <Stat label="Note cible" value={goal.targetGrade} />
              )}
            </>
          )}
          {goal.type === 'FITNESS' && (
            <>
              {goal.targetWeight != null && (
                <Stat label="Poids cible" value={`${goal.targetWeight} kg`} />
              )}
              {goal.targetBodyFat != null && (
                <Stat label="Masse grasse" value={`${goal.targetBodyFat}%`} />
              )}
              {goal.targetStrength && (
                <Stat label="Force cible" value={goal.targetStrength} />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Footer: date + gauge ── */}
      <div className="flex flex-col gap-2.5 pt-1 border-t border-border-subtle">
        {goal.targetDate && (
          <p className="font-space-grotesk text-[12px] text-text-muted">
            Échéance :{' '}
            <time dateTime={goal.targetDate.toISOString().slice(0, 10)}>
              {formatTargetDate(goal.targetDate)}
            </time>
          </p>
        )}

        <div className="flex items-center justify-between">
          <ToggleCompletedButton goalId={goal.id} completed={goal.completed} />
          <DeleteGoalButton goalId={goal.id} />
        </div>

        {goal.completed ? null : progress != null ? (
          <ScoreGauge value={progress} accent={gaugeAccent} label="Progression" />
        ) : (
          <span className="font-space-grotesk text-[12px] text-text-muted">
            En cours
          </span>
        )}
      </div>

    </div>
  )
}
