import Image from 'next/image'
import { PageLayout } from '@/components/layout/PageLayout'
import { CourseCard } from '@/components/ui/CourseCard'
import { CourseForm } from '@/components/ui/CourseForm'
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
      <div className="flex flex-col gap-6 max-w-5xl">

        {/* ── Formulaire de création ── */}
        <CourseForm />

        {/* ── Empty state ── */}
        {courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Image
              src="/assets/bear.png"
              width={120}
              height={120}
              alt=""
              aria-hidden="true"
              className="object-contain opacity-85"
            />
            <h2 className="font-syne text-[20px] font-bold text-text-primary">
              Aucun Cours pour le moment
            </h2>
            <p className="font-space-grotesk text-[14px] text-text-muted max-w-xs leading-relaxed">
              Crée tes Cours pour suivre tes Tâches, Échéances et ta progression.
            </p>
          </div>
        )}

        {/* ── Grille des cours ── */}
        {courses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        )}

      </div>
    </PageLayout>
  )
}
