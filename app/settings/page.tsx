import { PageLayout } from '@/components/layout/PageLayout'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await verifySession()

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      program: true,
    },
  })

  return (
    <PageLayout title="Réglages" etudiantNom={user.name}>
      <SettingsClient user={user} />
    </PageLayout>
  )
}
