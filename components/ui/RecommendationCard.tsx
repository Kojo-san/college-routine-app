import Image from 'next/image'
import type { RecommendationType } from '@/app/generated/prisma/client'
import { Badge } from './Badge'
import type { BadgeVariant } from './Badge'

const TYPE_BADGE: Record<RecommendationType, BadgeVariant> = {
  STUDY:    'study',
  FITNESS:  'fitness',
  RECOVERY: 'recovery',
  SLEEP:    'reco',
  PLANNING: 'reco',
  STRESS:   'warning',
}

const TYPE_LABEL: Record<RecommendationType, string> = {
  STUDY:    'ÉTUDE',
  FITNESS:  'FITNESS',
  RECOVERY: 'RÉCUP',
  SLEEP:    'SOMMEIL',
  PLANNING: 'PLANNING',
  STRESS:   'STRESS',
}

interface RecommendationCardProps {
  type: RecommendationType
  message: string
  source: string
  confidence: number
  onAct?: () => void
}

export function RecommendationCard({ type, message, source, confidence, onAct }: RecommendationCardProps) {
  return (
    <div
      className="bg-bg-surface rounded-xl p-4 grid gap-3"
      style={{
        border: '1px solid rgba(255, 107, 157, 0.3)',
        boxShadow: 'var(--glow-reco)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Image
          src="/assets/bear-neon.png"
          alt="Bear Reco"
          width={48}
          height={48}
          className="object-contain flex-shrink-0"
        />
        <Badge variant={TYPE_BADGE[type]}>{TYPE_LABEL[type]}</Badge>
      </div>

      {/* Message */}
      <p className="font-space-grotesk text-[14px] text-text-primary leading-relaxed">
        {message}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="font-space-grotesk text-[12px] text-text-muted">
          {source} · {Math.round(confidence * 100)}% confiance
        </span>
        {onAct && (
          <button
            type="button"
            onClick={onAct}
            className="font-space-grotesk text-[13px] font-semibold text-accent-reco hover:text-text-primary transition-colors focus-ring px-2 py-1 rounded"
          >
            Faire
          </button>
        )}
      </div>
    </div>
  )
}
