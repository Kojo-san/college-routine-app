import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

export default async function AgendaPage() {
  const { userId } = await verifySession()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

  return (
    <PageLayout title="Agenda" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <h2 className="font-syne text-[20px] font-bold text-text-primary">
          Agenda — À venir
        </h2>
        <p className="font-space-grotesk text-[14px] text-text-muted max-w-xs leading-relaxed">
          Cette section est en cours de développement.
        </p>
      </div>
    </PageLayout>
  )
}
