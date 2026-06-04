import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { EtatCard } from '@/components/ui/EtatCard'
import { Timeline } from '@/components/ui/Timeline'
import type { TimelineBlock } from '@/components/ui/Timeline'
import { RecommendationCard } from '@/components/ui/RecommendationCard'
import { GeneratePlanButton } from '@/components/ui/GeneratePlanButton'
import { getHealthData } from '@/lib/health'
import { getDailyPlan } from '@/lib/planning'
import prisma from '@/lib/prisma'
import type { RecommendationType } from '@/app/generated/prisma/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary">
      {children}
    </h2>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await prisma.user.findFirst({ select: { id: true, name: true } })
  const userId = user?.id ?? null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateLabel  = todayDateLabel()
  const dateISO    = todayISO()
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  const [healthData, plan] = await Promise.all([
    userId ? getHealthData(userId, today) : Promise.resolve(null),
    userId ? getDailyPlan(userId, today)  : Promise.resolve(null),
  ])

  // ── État props ──
  const etatProps =
    healthData?.recovery && healthData?.cognitive && healthData?.sleep
      ? {
          date: dateLabel,
          physical: {
            recovery:        healthData.recovery.value,
            physicalFatigue: healthData.recovery.physicalFatigue,
            sleepDebt:       healthData.recovery.sleepDebt,
          },
          cognitive: {
            focus:            healthData.cognitive.focusLevel,
            cognitiveFatigue: healthData.cognitive.mentalFatigue,
            stress:           healthData.cognitive.stressLevel,
            motivation:       healthData.cognitive.motivationLevel,
          },
          sleep: {
            durationHours: healthData.sleep.sleepDurationHours,
            efficiency:    healthData.sleep.sleepEfficiency,
          },
        }
      : null

  // ── Timeline props ──
  const timelineBlocks: TimelineBlock[] = plan?.timeBlocks.map(b => ({
    id:        b.id,
    type:      typeActiviteToBlockType(b.typeActivite),
    startTime: formatHHMM(b.startTime),
    endTime:   formatHHMM(b.endTime),
    title:     b.label,
  })) ?? []

  const startHour = plan?.timeBlocks[0]
    ? plan.timeBlocks[0].startTime.getHours()
    : 7
  const endHour = plan?.timeBlocks.length
    ? plan.timeBlocks[plan.timeBlocks.length - 1].endTime.getHours()
    : 23

  const firstRec = plan?.recommendations[0] ?? null

  return (
    <PageLayout title="Dashboard" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Date + Score ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-syne font-bold text-[18px] text-text-primary capitalize">
              <time dateTime={dateISO}>{dateLabel}</time>
            </p>
            {plan?.scoreJournee != null && (
              <p className="font-space-grotesk text-[12px] text-text-muted mt-0.5">
                Score journée — {plan.scoreJournee}/100
              </p>
            )}
          </div>
        </div>

        {/* ── État du jour ── */}
        <section aria-labelledby="dash-etat">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading id="dash-etat">État du jour</SectionHeading>
            <Link
              href="/sante"
              className="font-space-grotesk text-[13px] text-accent-study hover:text-text-primary transition-colors duration-150"
            >
              Santé →
            </Link>
          </div>

          {etatProps ? (
            <EtatCard {...etatProps} />
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex items-center justify-between gap-4">
              <p className="font-space-grotesk text-[13px] text-text-muted leading-relaxed">
                Aucun État calculé. Saisis tes Signaux pour débloquer l'analyse.
              </p>
              <Link
                href="/sante"
                className="font-space-grotesk text-[13px] font-semibold text-accent-study hover:text-text-primary transition-colors duration-150 whitespace-nowrap"
              >
                Saisir →
              </Link>
            </div>
          )}
        </section>

        {/* ── Planning du jour ── */}
        <section aria-labelledby="dash-planning">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading id="dash-planning">Planning du jour</SectionHeading>
            {plan && timelineBlocks.length > 0 && (
              <Link
                href="/planning"
                className="font-space-grotesk text-[13px] text-accent-study hover:text-text-primary transition-colors duration-150"
              >
                Voir tout →
              </Link>
            )}
          </div>

          {plan && timelineBlocks.length > 0 ? (
            <Timeline
              blocks={timelineBlocks}
              startHour={startHour}
              endHour={endHour}
              nowMinutes={nowMinutes}
            />
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col items-start gap-4">
              <p className="font-space-grotesk text-[13px] text-text-muted leading-relaxed">
                Aucun Planning généré pour aujourd'hui.
              </p>
              {userId ? (
                <GeneratePlanButton />
              ) : (
                <p className="font-space-grotesk text-[12px] text-text-muted">
                  Aucun étudiant enregistré.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Recommandation du jour ── */}
        {firstRec && (
          <section aria-labelledby="dash-reco">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading id="dash-reco">Recommandation du jour</SectionHeading>
              {(plan?.recommendations.length ?? 0) > 1 && (
                <Link
                  href="/planning"
                  className="font-space-grotesk text-[13px] text-accent-study hover:text-text-primary transition-colors duration-150"
                >
                  Voir tout →
                </Link>
              )}
            </div>
            <RecommendationCard
              type={firstRec.type as RecommendationType}
              message={firstRec.message}
              source={firstRec.explanation ?? 'Règle scientifique'}
              confidence={firstRec.confidenceScore}
            />
          </section>
        )}

      </div>
    </PageLayout>
  )
}
