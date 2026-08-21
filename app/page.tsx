import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
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

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary">
      {children}
    </h2>
  )
}

export default async function DashboardPage() {
  const { userId } = await verifySession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateLabel = todayDateLabel()
  const dateISO = todayISO()

  const [user, upcomingDeadlines] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.deadline.findMany({
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
    }),
  ])

  return (
    <PageLayout title="Dashboard" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Date ── */}
        <div>
          <p className="font-syne font-bold text-[18px] text-text-primary capitalize">
            <time dateTime={dateISO}>{dateLabel}</time>
          </p>
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

        {/* ── Agenda CTA ── */}
        <section aria-labelledby="dash-agenda">
          <SectionHeading id="dash-agenda">Ton horaire</SectionHeading>
          <div className="mt-4 bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col items-start gap-4">
            <p className="font-space-grotesk text-[13px] text-text-muted leading-relaxed">
              Consulte tes cours et activités de la semaine dans l&apos;agenda.
            </p>
            <Link
              href="/agenda"
              className="px-4 py-2 rounded-lg bg-[#C9006B] text-white font-space-grotesk text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Voir l&apos;agenda →
            </Link>
          </div>
        </section>

      </div>
    </PageLayout>
  )
}
