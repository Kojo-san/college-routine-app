import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { AgendaClient, type SerializedEvent } from './AgendaClient'

function typeActiviteToColor(type: string | null): string {
  switch (type) {
    case 'STUDY':    return 'study'
    case 'FITNESS':  return 'fitness'
    case 'RECOVERY': return 'recovery'
    case 'COURS':    return 'cours'
    case 'MEAL':     return 'meal'
    default:         return 'task'
  }
}

function typeActiviteToCategory(type: string | null): string {
  switch (type) {
    case 'STUDY':    return 'Étude'
    case 'FITNESS':  return 'Fitness'
    case 'RECOVERY': return 'Récupération'
    case 'COURS':    return 'Cours'
    case 'MEAL':     return 'Repas'
    default:         return 'Tâche'
  }
}

export default async function AgendaPage() {
  const { userId } = await verifySession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Current week: Sunday → Saturday
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [user, courses, dailyPlans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.course.findMany({
      where: { userId },
      include: { courseSchedules: true },
    }),
    prisma.dailyPlan.findMany({
      where: {
        userId,
        date: { gte: weekStart, lte: weekEnd },
      },
      include: { timeBlocks: true },
    }),
  ])

  const events: SerializedEvent[] = []

  // Expand recurring course schedules into concrete events for this week
  for (const course of courses) {
    for (const schedule of course.courseSchedules) {
      const eventDate = new Date(weekStart)
      eventDate.setDate(weekStart.getDate() + schedule.dayOfWeek)

      const [startH, startM] = schedule.startTime.split(':').map(Number)
      const [endH, endM]     = schedule.endTime.split(':').map(Number)

      const startTime = new Date(eventDate)
      startTime.setHours(startH, startM, 0, 0)

      const endTime = new Date(eventDate)
      endTime.setHours(endH, endM, 0, 0)

      const meta = [
        schedule.room  ? `Salle: ${schedule.room}`   : null,
        schedule.group ? `Groupe: ${schedule.group}` : null,
      ].filter(Boolean).join(' · ')

      events.push({
        id:          `schedule-${schedule.id}`,
        title:       `${course.code} — ${schedule.type === 'LAB' ? 'TP' : 'CM'}`,
        description: [course.name, meta].filter(Boolean).join(' · ') || undefined,
        startTime:   startTime.toISOString(),
        endTime:     endTime.toISOString(),
        color:       'cours',
        category:    'Cours',
        tags:        [schedule.type === 'LAB' ? 'TP' : 'CM'],
      })
    }
  }

  // Add daily plan time blocks
  for (const plan of dailyPlans) {
    for (const block of plan.timeBlocks) {
      events.push({
        id:        block.id,
        title:     block.label,
        startTime: block.startTime.toISOString(),
        endTime:   block.endTime.toISOString(),
        color:     typeActiviteToColor(block.typeActivite),
        category:  typeActiviteToCategory(block.typeActivite),
      })
    }
  }

  return (
    <PageLayout title="Agenda" etudiantNom={user?.name ?? undefined}>
      <AgendaClient initialEvents={events} />
    </PageLayout>
  )
}
