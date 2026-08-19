import { BlocCard } from './BlocCard'
import { EditableBlocCard } from './EditableBlocCard'
import type { BlocType } from './BlocCard'
import { TimelineNowLine } from './TimelineNowLine'

export interface TimelineBlock {
  id: string
  type: BlocType
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  progress?: number
}

interface TimelineProps {
  blocks: TimelineBlock[]
  startHour: number
  endHour: number
  nowMinutes?: number
  planId?: string  // when present, blocs are editable via inline pencil icon
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`
}

export function Timeline({ blocks, startHour, endHour, nowMinutes, planId }: TimelineProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  return (
    <div className="relative flex flex-col gap-1" aria-label="Planning du jour">
      <span className="font-space-grotesk text-[11px] text-[#ffffff25] w-12 flex-shrink-0">
        {formatHour(startHour)}
      </span>

      <div className="relative flex flex-col gap-1.5 pl-14">
        {blocks.map((block) =>
          planId ? (
            <EditableBlocCard
              key={block.id}
              blockId={block.id}
              planId={planId}
              type={block.type}
              startTime={block.startTime}
              endTime={block.endTime}
              title={block.title}
              subtitle={block.subtitle}
              progress={block.progress}
            />
          ) : (
            <BlocCard
              key={block.id}
              type={block.type}
              startTime={block.startTime}
              endTime={block.endTime}
              title={block.title}
              subtitle={block.subtitle}
              progress={block.progress}
            />
          )
        )}

        <TimelineNowLine startHour={startHour} endHour={endHour} nowMinutes={nowMinutes} />
      </div>

      <span className="font-space-grotesk text-[11px] text-[#ffffff25] w-12 flex-shrink-0 mt-1">
        {formatHour(endHour)}
      </span>
    </div>
  )
}
