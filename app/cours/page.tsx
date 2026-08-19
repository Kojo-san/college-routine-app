import { PageLayout } from '@/components/layout/PageLayout'
import { CoursPageClient } from './CoursPageClient'
import { getCourses } from '@/lib/courses'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

export default async function CoursPage() {
  const { userId } = await verifySession()
  const [user, courses] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getCourses(userId),
  ])

  return (
    <PageLayout title="Cours" etudiantNom={user?.name ?? undefined}>
      <CoursPageClient courses={courses} />
    </PageLayout>
  )
}
