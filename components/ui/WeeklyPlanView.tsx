import type { WeekDayPlan } from '@/lib/planning'
import { summarizePlanBlocks } from '@/lib/planning'

interface WeeklyPlanViewProps {
  week: WeekDayPlan[]
}

function DayCard({ day }: { day: WeekDayPlan }) {
  const hasPlan = day.plan !== null && day.plan.timeBlocks.length > 0
  const summary = hasPlan ? summarizePlanBlocks(day.plan!.timeBlocks) : null

  return (
    <div
      className={[
        'flex flex-col items-center gap-1 px-2 py-3 rounded-xl border flex-1 min-w-[44px] max-w-[60px]',
        day.isToday
          ? 'border-[var(--color-accent-study)] bg-[var(--color-bg-elevated)]'
          : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]',
      ].join(' ')}
    >
      {/* Day label */}
      <span
        className="font-syne text-[9px] font-bold uppercase tracking-widest"
        style={{ color: day.isToday ? 'var(--color-accent-study)' : 'var(--color-text-muted)' }}
      >
        {day.dayShort}
      </span>

      {/* Day number */}
      <span
        className="font-syne text-[15px] font-bold leading-none"
        style={{ color: day.isToday ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
      >
        {day.dayNum}
      </span>

      {/* Divider */}
      <div
        className="w-full h-px mt-0.5"
        style={{ background: 'var(--color-border-subtle)' }}
      />

      {/* Block summary or empty indicator */}
      {hasPlan && summary ? (
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <div className="flex gap-1 flex-wrap justify-center">
            {summary.study > 0 && (
              <span
                className="font-space-grotesk text-[9px] font-bold"
                style={{ color: 'var(--color-accent-study)' }}
              >
                S{summary.study}
              </span>
            )}
            {summary.fitness > 0 && (
              <span
                className="font-space-grotesk text-[9px] font-bold"
                style={{ color: 'var(--color-accent-fit)' }}
              >
                F{summary.fitness}
              </span>
            )}
            {summary.recovery > 0 && (
              <span
                className="font-space-grotesk text-[9px] font-bold"
                style={{ color: 'var(--color-accent-rec)' }}
              >
                R{summary.recovery}
              </span>
            )}
          </div>
          {day.plan!.scoreJournee !== null && (
            <span
              className="font-space-grotesk text-[8px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {Math.round(day.plan!.scoreJournee)}
            </span>
          )}
        </div>
      ) : (
        <span
          className="font-space-grotesk text-[11px] mt-0.5"
          style={{ color: 'var(--color-border-subtle)' }}
        >
          —
        </span>
      )}
    </div>
  )
}

export function WeeklyPlanView({ week }: WeeklyPlanViewProps) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {week.map((day, i) => (
          <DayCard key={i} day={day} />
        ))}
      </div>
    </div>
  )
}
