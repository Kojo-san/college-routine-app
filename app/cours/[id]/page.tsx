import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { DeadlineItem } from '@/components/ui/DeadlineItem'
import { TaskItem } from '@/components/ui/TaskItem'
import { TaskSection } from '@/components/ui/TaskSection'
import { DeadlineSection } from '@/components/ui/DeadlineSection'
import { DeleteCourseButton } from '@/components/ui/DeleteCourseButton'
import { DeleteTaskButton } from '@/components/ui/DeleteTaskButton'
import { EditTaskButton } from '@/components/ui/EditTaskButton'
import { getCourse } from '@/lib/courses'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { userId } = await verifySession()
  const { id } = await params

  const [course, user] = await Promise.all([
    getCourse(id),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])

  if (!course || course.userId !== userId) notFound()

  const pendingTasks   = course.tasks.filter((t) => !t.completed)
  const completedTasks = course.tasks.filter((t) => t.completed)

  return (
    <PageLayout title={course.name} etudiantNom={user?.name ?? undefined}>
      <div className="max-w-2xl flex flex-col gap-8">

        {/* ── Navigation ── */}
        <Link
          href="/cours"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[rgba(255,255,255,0.25)] px-3 py-1.5 font-space-grotesk text-[14px] text-white transition-colors hover:bg-white/5"
        >
          <ChevronLeft size={16} />
          Retour aux Cours
        </Link>

        {/* ── Métadonnées ── */}
        <div className="flex items-center gap-4">
          <span className="font-space-grotesk text-[13px] font-semibold tracking-[0.1em] uppercase text-text-muted">
            {course.code}
          </span>
          {(course.courseHours > 0 || course.labHours > 0 || course.personalHours > 0) && (
            <span className="font-space-grotesk text-[12px] text-text-muted">
              {course.courseHours}h cours · {course.labHours}h lab · {course.personalHours}h perso
            </span>
          )}
        </div>

        {/* ── Échéances ── */}
        <DeadlineSection courseId={id}>
          {course.deadlines.length === 0 ? (
            <p className="font-space-grotesk text-[13px] text-text-muted">
              Aucune Échéance.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {course.deadlines.map((d) => (
                <DeadlineItem
                  key={d.id}
                  id={d.id}
                  courseId={id}
                  title={d.title}
                  dueDate={d.dueDate}
                  weight={d.weight}
                  completed={d.completed}
                />
              ))}
            </div>
          )}
        </DeadlineSection>

        {/* ── Tâches à faire ── */}
        <TaskSection courseId={id} taskCount={pendingTasks.length}>
          {pendingTasks.length === 0 ? (
            <p className="font-space-grotesk text-[13px] text-text-muted">
              Aucune tâche en cours.
            </p>
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl px-4">
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  estimatedDurationMinutes={task.estimatedDurationMinutes}
                  priority={task.priority}
                  defaultCompleted={false}
                  actions={
                    <>
                      <EditTaskButton
                        taskId={task.id}
                        courseId={id}
                        title={task.title}
                        description={task.description}
                        estimatedDurationMinutes={task.estimatedDurationMinutes}
                      />
                      <DeleteTaskButton taskId={task.id} courseId={id} />
                    </>
                  }
                />
              ))}
            </div>
          )}
        </TaskSection>

        {/* ── Tâches complétées ── */}
        {completedTasks.length > 0 && (
          <section>
            <h2 className="font-syne text-[18px] font-bold text-text-muted mb-4">
              Complétées
              <span className="font-space-grotesk text-[13px] font-normal ml-2">
                {completedTasks.length}
              </span>
            </h2>
            <div className="bg-bg-surface border border-border-subtle rounded-xl px-4 opacity-60">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  estimatedDurationMinutes={task.estimatedDurationMinutes}
                  priority={task.priority}
                  defaultCompleted={true}
                  actions={
                    <>
                      <EditTaskButton
                        taskId={task.id}
                        courseId={id}
                        title={task.title}
                        description={task.description}
                        estimatedDurationMinutes={task.estimatedDurationMinutes}
                      />
                      <DeleteTaskButton taskId={task.id} courseId={id} />
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Suppression ── */}
        <section className="border-t border-border-subtle pt-6">
          <DeleteCourseButton courseId={id} />
        </section>

      </div>
    </PageLayout>
  )
}
