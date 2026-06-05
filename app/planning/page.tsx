import Image from 'next/image'
import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Timeline } from '@/components/ui/Timeline'
import type { TimelineBlock } from '@/components/ui/Timeline'
import { RecommendationCard } from '@/components/ui/RecommendationCard'
import { GeneratePlanButton } from '@/components/ui/GeneratePlanButton'
import { WeeklyPlanView } from '@/components/ui/WeeklyPlanView'
import { GoogleCalendarButton } from '@/components/ui/GoogleCalendarButton'
import { getDailyPlan, getWeeklyPlans, buildWeekDates, formatWeekRange } from '@/lib/planning'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import type { RecommendationType } from '@/app/generated/prisma/client'

function todayDateLabel(): string {
  return new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatHHMM(dt: Date): string {
  return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
}

type BlocType = 'study' | 'fitness' | 'recovery' | 'task' | 'meal'

function typeActiviteToBlockType(typeActivite: string | null): BlocType {
  switch (typeActivite) {
    case 'STUDY':    return 'study'
    case 'FITNESS':  return 'fitness'
    case 'RECOVERY': return 'recovery'
    case 'MEAL':     return 'meal'
    default:         return 'task'
  }
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary mb-4">
      {children}
    </h2>
  )
}

export default async function PlanningPage() {
  const { userId } = await verifySession()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekDates = buildWeekDates(today)

  const [user, plan, week, gcalToken] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getDailyPlan(userId, today),
    getWeeklyPlans(userId, weekDates),
    prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider: 'google' } },
      select: { id: true },
    }),
  ])

  const gcalConnected = gcalToken !== null

  const dateLabel = todayDateLabel()
  const dateISO   = todayISO()

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const weekRangeLabel = week.length === 7
    ? formatWeekRange(weekDates[0], weekDates[6])
    : null

  // ── Empty state ──
  if (!plan || plan.timeBlocks.length === 0) {
    return (
      <PageLayout title="Planning" etudiantNom={user?.name ?? undefined}>
        <div className="flex flex-col gap-8 max-w-2xl">

          {/* ── Vue semaine ── */}
          {week.length > 0 && (
            <section aria-labelledby="heading-semaine">
              <SectionHeading id="heading-semaine">
                {weekRangeLabel ?? 'Cette semaine'}
              </SectionHeading>
              <WeeklyPlanView week={week} />
            </section>
          )}

          <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 flex flex-col items-center gap-4 text-center">
            <Image
              src="/assets/bear.png"
              width={120}
              height={120}
              alt=""
              aria-hidden="true"
              className="object-contain opacity-85"
            />
            <h2 className="font-syne font-bold text-[17px] text-text-primary">
              Aucun Planning pour aujourd'hui
            </h2>
            <p className="font-space-grotesk text-[13px] text-text-muted max-w-xs leading-relaxed">
              Lance la génération pour obtenir un Planning adaptatif basé sur ton État et tes Échéances.
            </p>
            <div className="flex flex-col items-center gap-3">
                <GeneratePlanButton />
                <Suspense>
                  <GoogleCalendarButton connected={gcalConnected} />
                </Suspense>
              </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  // ── Convert TimeBlocks to Timeline format ──
  const timelineBlocks: TimelineBlock[] = plan.timeBlocks.map(b => ({
    id: b.id,
    type: typeActiviteToBlockType(b.typeActivite),
    startTime: formatHHMM(b.startTime),
    endTime: formatHHMM(b.endTime),
    title: b.label,
  }))

  const firstBlock = plan.timeBlocks[0]
  const lastBlock  = plan.timeBlocks[plan.timeBlocks.length - 1]
  const startHour  = firstBlock.startTime.getHours()
  const endHour    = lastBlock.endTime.getHours()

  return (
    <PageLayout title="Planning" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Vue semaine ── */}
        {week.length > 0 && (
          <section aria-labelledby="heading-semaine">
            <SectionHeading id="heading-semaine">
              {weekRangeLabel ?? 'Cette semaine'}
            </SectionHeading>
            <WeeklyPlanView week={week} />
          </section>
        )}

        {/* ── Header du jour ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-syne font-bold text-[18px] text-text-primary capitalize">
              <time dateTime={dateISO}>{dateLabel}</time>
            </p>
            {plan.scoreJournee !== null && (
              <p className="font-space-grotesk text-[12px] text-text-muted mt-0.5">
                Score journée — {plan.scoreJournee}/100
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Suspense>
              <GoogleCalendarButton connected={gcalConnected} />
            </Suspense>
            <GeneratePlanButton label="Régénérer" />
          </div>
        </div>

        {/* ── Timeline ── */}
        <section aria-labelledby="heading-timeline">
          <SectionHeading id="heading-timeline">Planning du jour</SectionHeading>
          <Timeline
            blocks={timelineBlocks}
            startHour={startHour}
            endHour={endHour}
            nowMinutes={nowMinutes}
            planId={plan.id}
          />
        </section>

        {/* ── Recommandations ── */}
        {plan.recommendations.length > 0 && (
          <section aria-labelledby="heading-reco">
            <SectionHeading id="heading-reco">Recommandations</SectionHeading>
            <div className="flex flex-col gap-3">
              {plan.recommendations.map(r => (
                <RecommendationCard
                  key={r.id}
                  type={r.type as RecommendationType}
                  message={r.message}
                  source={r.explanation ?? 'Règle scientifique'}
                  confidence={r.confidenceScore}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </PageLayout>
  )
}
