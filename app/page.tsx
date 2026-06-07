import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { Timeline } from '@/components/ui/Timeline'
import type { TimelineBlock } from '@/components/ui/Timeline'
import { RecommendationCard } from '@/components/ui/RecommendationCard'
import { GeneratePlanButton } from '@/components/ui/GeneratePlanButton'
import { getDailyPlan } from '@/lib/planning'
import { getRotationTypeForDayOfWeek } from '@/lib/gym'
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

type BlocType = 'study' | 'fitness' | 'recovery' | 'task' | 'meal' | 'cours'

function typeActiviteToBlockType(typeActivite: string | null): BlocType {
  switch (typeActivite) {
    case 'STUDY':    return 'study'
    case 'FITNESS':  return 'fitness'
    case 'RECOVERY': return 'recovery'
    case 'COURS':    return 'cours'
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

  const [plan, upcomingDeadlines] = await Promise.all([
    userId ? getDailyPlan(userId, today) : Promise.resolve(null),
    userId
      ? prisma.deadline.findMany({
          where: {
            completed: false,
            course: { userId },
            dueDate: {
              gte: today,
              lte: new Date(today.getTime() + 48 * 60 * 60 * 1000),
            },
          },
          include: { course: { select: { code: true } } },
          orderBy: { dueDate: 'asc' },
        })
      : Promise.resolve([]),
  ])

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

  // ── Gym suggestion: first FITNESS bloc in today's plan ──
  const gymBloc = plan?.timeBlocks.find(b => b.typeActivite === 'FITNESS') ?? null
  const todayGymTab = getRotationTypeForDayOfWeek(today.getDay())
  const gymSuggestion = gymBloc
    ? `Tu peux aller au gym à ${formatHHMM(gymBloc.startTime)} — ${todayGymTab}`
    : null

  const firstRec = plan?.recommendations[0] ?? null

  return (
    <PageLayout title="Dashboard" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Date ── */}
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

        {/* ── Deadlines <48h ── */}
        {upcomingDeadlines.length > 0 && (
          <section aria-labelledby="dash-deadlines" aria-live="polite">
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{
                background: 'rgba(255,179,71,0.08)',
                border: '1px solid rgba(255,179,71,0.3)',
              }}
            >
              <p className="font-syne font-bold text-[14px]" style={{ color: '#FFB347' }}>
                ⚠ Échéance(s) dans moins de 48h
              </p>
              <ul className="flex flex-col gap-1">
                {upcomingDeadlines.map(d => (
                  <li key={d.id} className="font-space-grotesk text-[13px] text-text-primary flex items-center justify-between gap-2">
                    <span>
                      <span className="text-text-muted">{d.course.code}</span>
                      {' — '}{d.title}
                    </span>
                    <span className="font-space-grotesk text-[12px] text-text-muted whitespace-nowrap">
                      {d.dueDate.toLocaleDateString('fr-CA', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Gym suggestion ── */}
        {gymSuggestion && (
          <section aria-labelledby="dash-gym">
            <Link href={`/gym?type=${encodeURIComponent(todayGymTab)}`} className="block">
              <div
                className="rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-150 hover:opacity-80"
                style={{
                  background: 'rgba(255,209,102,0.08)',
                  border: '1px solid rgba(255,209,102,0.25)',
                }}
              >
                <div>
                  <p className="font-syne font-bold text-[14px]" style={{ color: '#FFD166' }}>
                    Gym aujourd'hui
                  </p>
                  <p className="font-space-grotesk text-[13px] text-text-muted mt-0.5">
                    {gymSuggestion}
                  </p>
                </div>
                <span className="font-space-grotesk text-[12px] font-semibold text-text-muted whitespace-nowrap">
                  Voir →
                </span>
              </div>
            </Link>
          </section>
        )}

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
