import Image from 'next/image'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { fetchWgerExercises, getGymRotationType } from '@/lib/gym'
import type { GymSessionType } from '@/lib/gym'
import { getDailyPlan } from '@/lib/planning'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px]" style={{ color: 'var(--color-text-primary)' }}>
      {children}
    </h2>
  )
}

// Derive today's rotation index from the day of year (stable per day)
function todayRotationIndex(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return dayOfYear
}

const SESSION_TYPE_COLORS: Record<GymSessionType, { bg: string; border: string; text: string }> = {
  'Push Day':   { bg: 'rgba(255,209,102,0.10)', border: 'rgba(255,209,102,0.3)', text: '#FFD166' },
  'Pull Day':   { bg: 'rgba(74,158,255,0.10)',  border: 'rgba(74,158,255,0.3)',  text: '#4A9EFF' },
  'Leg Day':    { bg: 'rgba(168,255,120,0.10)', border: 'rgba(168,255,120,0.3)', text: '#A8FF78' },
  'Full Body':  { bg: 'rgba(155,143,255,0.10)', border: 'rgba(155,143,255,0.3)', text: '#9B8FFF' },
  'Cardio':     { bg: 'rgba(255,107,157,0.10)', border: 'rgba(255,107,157,0.3)', text: '#FF6B9D' },
  'Stretching': { bg: 'rgba(255,179,71,0.10)',  border: 'rgba(255,179,71,0.3)',  text: '#FFB347' },
}

const ALL_SESSION_TYPES: GymSessionType[] = ['Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Cardio', 'Stretching']

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
  const rotationIdx = todayRotationIndex()
  const todayType   = getGymRotationType(rotationIdx)

  // Active type from query param or today's rotation
  const requestedType = params.type as GymSessionType | undefined
  const activeType: GymSessionType = ALL_SESSION_TYPES.includes(requestedType as GymSessionType)
    ? (requestedType as GymSessionType)
    : todayType

  const sessionDuration = gymPrefs?.sessionDurationMinutes ?? 60

  // Find gym bloc in today's plan for contextual CTA
  const gymBloc = plan?.timeBlocks.find(b => b.typeActivite === 'FITNESS') ?? null

  const exercises = await fetchWgerExercises(activeType, sessionDuration)

  const colors = SESSION_TYPE_COLORS[activeType]

  return (
    <PageLayout title="Gym" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Suggestion du jour ── */}
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
                {todayType} · {sessionDuration} min
              </p>
            </div>
            <span
              className="font-space-grotesk text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,209,102,0.15)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)' }}
            >
              {new Date(gymBloc.startTime).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* ── Type selector ── */}
        <section aria-labelledby="type-selector">
          <div className="flex items-center justify-between mb-3">
            <SectionHeading id="type-selector">Type de séance</SectionHeading>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_SESSION_TYPES.map(type => {
              const c = SESSION_TYPE_COLORS[type]
              const isActive = type === activeType
              return (
                <Link
                  key={type}
                  href={`/gym?type=${encodeURIComponent(type)}`}
                  className="font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                  style={{
                    background: isActive ? c.bg : 'var(--color-bg-elevated)',
                    border: `1px solid ${isActive ? c.border : 'var(--color-border-subtle)'}`,
                    color: isActive ? c.text : 'var(--color-text-muted)',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {type}
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Active type header ── */}
        <div
          className="rounded-xl p-5 flex items-center justify-between gap-4"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          <div>
            <p
              className="font-syne font-bold text-[22px]"
              style={{ color: colors.text }}
            >
              {activeType}
            </p>
            <p className="font-space-grotesk text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {exercises.length} exercice{exercises.length !== 1 ? 's' : ''} · {sessionDuration} min
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
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
            >
              <Image src="/assets/bear.png" width={100} height={100} alt="" aria-hidden="true" className="object-contain opacity-70" />
              <p className="font-syne font-bold text-[16px]" style={{ color: 'var(--color-text-primary)' }}>
                Catalogue indisponible
              </p>
              <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                Impossible de contacter wger.de. Réessaie dans quelques instants.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {exercises.map(ex => (
                <div
                  key={ex.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-syne font-bold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
                        {ex.name}
                      </p>
                      <p className="font-space-grotesk text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {ex.muscles.join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="font-syne font-bold text-[15px]"
                        style={{ color: colors.text }}
                      >
                        {ex.sets} × {ex.reps > 0 ? ex.reps : '—'}
                      </span>
                      <span className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        ~{ex.durationMinutes} min
                      </span>
                    </div>
                  </div>
                </div>
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
