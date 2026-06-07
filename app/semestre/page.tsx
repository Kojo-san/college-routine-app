import { PageLayout } from '@/components/layout/PageLayout'
import { SemesterSetupForm } from '@/components/ui/SemesterSetupForm'
import { buildGridSlots } from '@/lib/semester'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

export default async function SemestrePage() {
  const { userId } = await verifySession()

  const [user, setup, gymPrefs, rawCourses] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.semesterSetup.findUnique({
      where: { userId },
      include: {
        courseHours: { select: { courseId: true, personalHoursPerWeek: true } },
      },
    }),
    prisma.gymPreferences.findUnique({ where: { userId } }),
    prisma.course.findMany({
      where: { userId },
      include: {
        courseSchedules: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const hoursMap = new Map(
    (setup?.courseHours ?? []).map(h => [h.courseId, h.personalHoursPerWeek]),
  )

  const courses = rawCourses.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    currentHours: hoursMap.get(c.id) ?? c.estimatedWeeklyWorkload,
    schedules: buildGridSlots(
      c.courseSchedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime:   s.endTime,
        type:      s.type as 'COURS' | 'LAB',
        code:      c.code,
        room:      s.room  ?? undefined,
        group:     s.group ?? undefined,
      })),
      7,
      22,
    ),
  }))

  const allSlots = buildGridSlots(
    rawCourses.flatMap(c =>
      c.courseSchedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime:   s.endTime,
        type:      s.type as 'COURS' | 'LAB',
        code:      c.code,
        room:      s.room  ?? undefined,
        group:     s.group ?? undefined,
      })),
    ),
    7,
    22,
  )

  return (
    <PageLayout title="Planification du trimestre" etudiantNom={user?.name ?? undefined}>
      <SemesterSetupForm
        courses={courses}
        wakeTime={setup?.wakeTime ?? '07:00'}
        sleepTime={setup?.sleepTime ?? '23:00'}
        gymPrefs={{
          frequencyPerWeek:      gymPrefs?.frequencyPerWeek      ?? 3,
          sessionDurationMinutes: gymPrefs?.sessionDurationMinutes ?? 60,
          preferredDays:          gymPrefs?.preferredDays          ?? [1, 3, 5],
          preferredTime:          (gymPrefs?.preferredTime as 'matin' | 'après-midi' | 'soir') ?? 'soir',
        }}
        gridSlots={allSlots}
      />
    </PageLayout>
  )
}
