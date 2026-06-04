import { ScoreGauge } from './ScoreGauge'

interface PhysicalState {
  recovery: number
  physicalFatigue: number
  sleepDebt: number
}

interface CognitiveState {
  focus: number
  cognitiveFatigue: number
  stress: number
  motivation: number
}

interface SleepSummary {
  durationHours: number
  efficiency: number
}

interface EtatCardProps {
  date: string
  physical: PhysicalState
  cognitive: CognitiveState
  sleep: SleepSummary
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m.toString().padStart(2, '0')}`
}

function EtatRow({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="font-space-grotesk text-[13px] text-text-muted">{label}</span>
      <span className="font-space-grotesk text-[13px] font-semibold text-text-primary">
        {value}{unit}
      </span>
    </div>
  )
}

export function EtatCard({ date, physical, cognitive, sleep }: EtatCardProps) {
  return (
    <div
      className="bg-bg-surface border border-border-subtle rounded-xl p-5"
    >
      <p className="font-space-grotesk text-[13px] font-medium text-text-muted mb-4">
        État du jour — {date}
      </p>

      <div className="grid grid-cols-2 gap-5">
        {/* Physique */}
        <div>
          <p className="font-syne text-[13px] font-bold tracking-[0.08em] uppercase text-text-muted mb-3">
            ⚡ Physique
          </p>
          <div className="flex flex-col gap-2 mb-2">
            <span className="font-space-grotesk text-[12px] text-text-muted">Récupération</span>
            <ScoreGauge value={physical.recovery} accent="recovery" label="Récupération" />
          </div>
          <EtatRow label="Fatigue phys." value={`${physical.physicalFatigue}%`} />
          <EtatRow
            label="Dette sommeil"
            value={physical.sleepDebt === 0 ? '0h' : `${physical.sleepDebt}h`}
          />
        </div>

        {/* Cognitif */}
        <div>
          <p className="font-syne text-[13px] font-bold tracking-[0.08em] uppercase text-text-muted mb-3">
            🧠 Cognitif
          </p>
          <div className="flex flex-col gap-2 mb-2">
            <span className="font-space-grotesk text-[12px] text-text-muted">Focus</span>
            <ScoreGauge value={cognitive.focus} accent="study" label="Focus" />
          </div>
          <EtatRow label="Fatigue cog." value={`${cognitive.cognitiveFatigue}%`} />
          <EtatRow label="Stress" value={`${cognitive.stress}%`} />
          <EtatRow label="Motivation" value={`${cognitive.motivation}%`} />
        </div>
      </div>

      {/* Sommeil */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <span className="font-space-grotesk text-[12px] text-text-muted">
          Sommeil : {formatDuration(sleep.durationHours)} · {Math.round(sleep.efficiency * 100)}% efficacité
        </span>
      </div>
    </div>
  )
}
