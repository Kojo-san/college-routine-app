import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
import { getWeekEvents } from '@/lib/events'
import { getMondayLocal } from '@/lib/weekDates'
import { hashCourseColor } from '@/lib/courseColor'
import prisma from '@/lib/prisma'

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

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

function daysUntil(dueDate: Date, today: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / msPerDay)
}

function deadlineBadgeStyle(daysLeft: number): { background: string; color: string } {
  if (daysLeft <= 3) return { background: 'rgba(255,60,60,0.15)', color: '#ff6b6b' }
  if (daysLeft <= 7) return { background: 'rgba(255,179,71,0.15)', color: '#FFB347' }
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary">
      {children}
    </h2>
  )
}

export default async function DashboardPage() {
  const { userId } = await verifySession()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const dateLabel = todayDateLabel()
  const dateISO = todayISO()

  const [user, weekEvents, upcomingDeadlines] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getWeekEvents(userId, getMondayLocal(now)),
    prisma.deadline.findMany({
      where: {
        completed: false,
        course: { userId },
        dueDate: { gte: today },
      },
      include: { course: { select: { code: true, name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  const nextEvents = weekEvents
    .filter((e) => new Date(e.startTime) >= now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 3)

  return (
    <PageLayout title="Dashboard" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Date ── */}
        <div>
          <p className="font-syne font-bold text-[18px] text-text-primary capitalize">
            <time dateTime={dateISO}>{dateLabel}</time>
          </p>
        </div>

        {/* ── Aujourd'hui / Cette semaine ── */}
        <section aria-labelledby="dash-week">
          <SectionHeading id="dash-week">Aujourd&apos;hui / Cette semaine</SectionHeading>
          <div className="mt-4 bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
            {nextEvents.length === 0 ? (
              <p className="font-space-grotesk text-[13px] text-text-muted">
                Pas de cours aujourd&apos;hui
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {nextEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-block rounded-full shrink-0"
                      style={{ width: 8, height: 8, backgroundColor: e.color }}
                    />
                    <span className="font-space-grotesk text-[13px] text-text-primary truncate flex-1">
                      {e.title}
                    </span>
                    <span className="font-space-grotesk text-[12px] text-text-muted whitespace-nowrap">
                      {formatTimeRange(new Date(e.startTime), new Date(e.endTime))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/agenda"
              className="app-btn-primary self-start inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-space-grotesk text-sm font-semibold"
            >
              Voir la semaine complète
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── Échéances à venir ── */}
        <section aria-labelledby="dash-deadlines">
          <SectionHeading id="dash-deadlines">Échéances à venir</SectionHeading>
          <div className="mt-4 bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
            {upcomingDeadlines.length === 0 ? (
              <p className="font-space-grotesk text-[13px] text-text-muted">
                Aucune échéance à venir
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {upcomingDeadlines.map((d) => {
                  const daysLeft = daysUntil(d.dueDate, today)
                  const badge = deadlineBadgeStyle(daysLeft)
                  const label = daysLeft <= 0 ? "Aujourd'hui" : daysLeft === 1 ? 'Demain' : `Dans ${daysLeft} jours`
                  return (
                    <li key={d.id} className="flex items-center gap-3">
                      <span
                        className="font-space-grotesk text-[11px] font-semibold shrink-0"
                        style={{ color: hashCourseColor(d.course.code || d.course.name) }}
                      >
                        {d.course.code}
                      </span>
                      <span className="font-space-grotesk text-[13px] text-text-primary truncate flex-1">
                        {d.title}
                      </span>
                      <span
                        className="font-space-grotesk text-[11px] font-semibold whitespace-nowrap px-2 py-1 rounded-full"
                        style={badge}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link
              href="/cours"
              className="app-btn-primary self-start inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-space-grotesk text-sm font-semibold"
            >
              Voir tous les cours
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </div>
    </PageLayout>
  )
}
