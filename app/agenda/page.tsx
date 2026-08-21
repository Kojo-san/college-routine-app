import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
import { getWeekEvents, hasAnyEvents } from '@/lib/events'
import { getMondayUTC } from '@/lib/weekDates'
import prisma from '@/lib/prisma'
import { AgendaClient } from './AgendaClient'

export default async function AgendaPage() {
  const { userId } = await verifySession()

  const weekStart = getMondayUTC(new Date())

  const [user, events, anyEvents] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getWeekEvents(userId, weekStart),
    hasAnyEvents(userId),
  ])

  return (
    <PageLayout title="Agenda" etudiantNom={user?.name ?? undefined}>
      <AgendaClient
        initialWeekStart={weekStart.toISOString()}
        initialEvents={events}
        initiallyEmpty={!anyEvents}
      />
    </PageLayout>
  )
}
