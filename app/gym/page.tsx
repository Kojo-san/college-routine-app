import Image from 'next/image'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { GymExerciseCard } from '@/components/ui/GymExerciseCard'
import {
  ALL_GYM_TABS,
  SESSION_TYPE_COLORS,
  TAB_TO_DB_TYPES,
  getRotationTypeForDayOfWeek,
  estimateSessionMinutes,
} from '@/lib/gym'
import type { GymTabType } from '@/lib/gym'
import { getDailyPlan } from '@/lib/planning'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import type { Exercise } from '@/app/generated/prisma/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-syne font-bold text-[18px]"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {children}
    </h2>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GymPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { userId } = await verifySession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [user, plan, gymPrefs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getDailyPlan(userId, today),
    prisma.gymPreferences.findUnique({ where: { userId } }),
  ])

  const params = await searchParams
  const todayTab = getRotationTypeForDayOfWeek(new Date().getDay())

  const requestedType = params.type as GymTabType | undefined
  const activeTab: GymTabType = ALL_GYM_TABS.includes(requestedType as GymTabType)
    ? (requestedType as GymTabType)
    : todayTab

  const dbTypes = TAB_TO_DB_TYPES[activeTab]
  const colors = SESSION_TYPE_COLORS[activeTab]

  // Fetch exercises for the active tab (server-side Prisma, no HTTP overhead)
  const exercises: Exercise[] = await prisma.exercise.findMany({
    where: { type: { in: dbTypes } },
    orderBy: [{ type: 'asc' }, { level: 'asc' }, { name: 'asc' }],
  })

  const sessionDuration = gymPrefs?.sessionDurationMinutes ?? estimateSessionMinutes(exercises.length)

  const gymBloc = plan?.timeBlocks.find(b => b.typeActivite === 'FITNESS') ?? null

  // Accent values for card badges
  const accentBg = colors.bg
  const accentText = colors.text

  return (
    <PageLayout title="Gym" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Séance du jour banner ── */}
        {gymBloc && (
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.25)' }}
            role="banner"
          >
            <div>
              <p className="font-syne font-bold text-[14px]" style={{ color: '#FFD166' }}>
                Séance du jour
              </p>
              <p className="font-space-grotesk text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {todayTab} · {sessionDuration} min
              </p>
            </div>
            <span
              className="font-space-grotesk text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,209,102,0.15)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)' }}
            >
              {new Date(gymBloc.startTime).toLocaleTimeString('fr-CA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {/* ── Tab selector ── */}
        <section aria-labelledby="gym-tabs">
          <div className="flex items-center justify-between mb-3">
            <SectionHeading id="gym-tabs">Type de séance</SectionHeading>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_GYM_TABS.map(tab => {
              const c = SESSION_TYPE_COLORS[tab]
              const isActive = tab === activeTab
              return (
                <Link
                  key={tab}
                  href={`/gym?type=${encodeURIComponent(tab)}`}
                  className="font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                  style={{
                    background: isActive ? c.bg : 'var(--color-bg-elevated)',
                    border: `1px solid ${isActive ? c.border : 'var(--color-border-subtle)'}`,
                    color: isActive ? c.text : 'var(--color-text-muted)',
                    boxShadow: isActive ? `0 0 12px ${c.glow}` : 'none',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab}
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Session header ── */}
        <div
          className="rounded-xl p-5 flex items-center justify-between gap-4"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
        >
          <div>
            <p className="font-syne font-bold text-[24px]" style={{ color: colors.text }}>
              {activeTab}
            </p>
            <p className="font-space-grotesk text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {exercises.length} exercice{exercises.length !== 1 ? 's' : ''} · ~{sessionDuration} min
            </p>
          </div>
          <Image
            src="/assets/bear-neon.png"
            alt=""
            width={48}
            height={48}
            className="object-contain"
            aria-hidden="true"
          />
        </div>

        {/* ── Exercise list ── */}
        <section aria-labelledby="exercises-heading">
          <SectionHeading id="exercises-heading">Exercices</SectionHeading>

          {exercises.length === 0 ? (
            <div
              className="rounded-xl p-8 flex flex-col items-center gap-4 text-center mt-4"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Image
                src="/assets/bear.png"
                width={100}
                height={100}
                alt=""
                aria-hidden="true"
                className="object-contain opacity-70"
              />
              <p className="font-syne font-bold text-[16px]" style={{ color: 'var(--color-text-primary)' }}>
                Aucun exercice
              </p>
              <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Le catalogue ne contient pas encore d'exercices pour ce type.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {exercises.map(ex => (
                <GymExerciseCard
                  key={ex.id}
                  name={ex.name}
                  muscleGroup={ex.muscleGroup}
                  equipment={ex.equipment}
                  sets={ex.sets}
                  reps={ex.reps}
                  level={ex.level}
                  description={ex.description}
                  exerciseDbId={ex.exerciseDbId ?? null}
                  accentText={accentText}
                  accentBg={accentBg}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Link to Semestre config ── */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <Link
            href="/semestre"
            className="font-space-grotesk text-[13px] transition-colors duration-150"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Modifier les préférences gym →
          </Link>
        </div>

      </div>
    </PageLayout>
  )
}
