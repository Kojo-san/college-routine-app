import { getOptionalSession } from '@/lib/session'
import { detectRecurringSlots } from '@/lib/schedule'
import prisma from '@/lib/prisma'

// POST /api/semestre/cours
// Body: { courseId, scheduleText, personalHoursPerWeek }
// Saves CourseSchedule slots + CoursePersonalHours for one course
export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()

  const { courseId, scheduleText, personalHoursPerWeek } = body

  if (typeof courseId !== 'string' || !courseId) {
    return Response.json({ error: 'courseId requis' }, { status: 400 })
  }
  if (typeof personalHoursPerWeek !== 'number' || personalHoursPerWeek < 0) {
    return Response.json({ error: 'personalHoursPerWeek invalide' }, { status: 400 })
  }

  // Verify course belongs to user
  const course = await prisma.course.findFirst({ where: { id: courseId, userId } })
  if (!course) return Response.json({ error: 'Cours introuvable' }, { status: 404 })

  const slots = typeof scheduleText === 'string' ? detectRecurringSlots(scheduleText) : []

  // Ensure SemesterSetup exists
  const setup = await prisma.semesterSetup.upsert({
    where: { userId },
    create: { userId, wakeTime: '07:00', sleepTime: '23:00' },
    update: {},
  })

  await prisma.$transaction([
    // Replace all schedules for this course
    prisma.courseSchedule.deleteMany({ where: { courseId } }),
    ...(slots.length > 0
      ? [prisma.courseSchedule.createMany({
          data: slots.map(s => ({
            courseId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
          })),
        })]
      : []),
    // Upsert personal hours
    prisma.coursePersonalHours.upsert({
      where: { semesterSetupId_courseId: { semesterSetupId: setup.id, courseId } },
      create: { semesterSetupId: setup.id, courseId, personalHoursPerWeek },
      update: { personalHoursPerWeek },
    }),
  ])

  return Response.json({ data: { slotsDetected: slots.length, personalHoursPerWeek } }, { status: 201 })
}
