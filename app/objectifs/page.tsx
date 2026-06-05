import Image from 'next/image'
import { PageLayout } from '@/components/layout/PageLayout'
import { ObjectifCard } from '@/components/ui/ObjectifCard'
import { ObjectifForm } from '@/components/ui/ObjectifForm'
import { getGoals } from '@/lib/goals'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary mb-4">
      {children}
    </h2>
  )
}

export default async function ObjectifsPage() {
  const { userId } = await verifySession()
  const [user, goals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getGoals(userId),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const academic = goals.filter(g => g.type === 'ACADEMIC')
  const fitness  = goals.filter(g => g.type === 'FITNESS')

  return (
    <PageLayout title="Objectifs" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Formulaire de création ── */}
        <ObjectifForm />

        {/* ── Empty state (si aucun objectif) ── */}
        {goals.length === 0 && (
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-10 flex flex-col items-center gap-5 text-center">
            <Image
              src="/assets/bear.png"
              width={120}
              height={120}
              alt=""
              aria-hidden="true"
              className="object-contain opacity-85"
            />
            <h2 className="font-syne font-bold text-[17px] text-text-primary">
              Aucun Objectif défini
            </h2>
            <p className="font-space-grotesk text-[13px] text-text-muted max-w-xs leading-relaxed">
              Définis tes Objectifs académiques et physiques pour orienter la composition de tes Plannings.
            </p>
          </div>
        )}

        {/* ── Objectifs académiques ── */}
        {academic.length > 0 && (
          <section aria-labelledby="obj-academic">
            <SectionHeading id="obj-academic">Académiques</SectionHeading>
            <div className="flex flex-col gap-4">
              {academic.map(g => (
                <ObjectifCard key={g.id} goal={g} today={today} />
              ))}
            </div>
          </section>
        )}

        {/* ── Objectifs fitness ── */}
        {fitness.length > 0 && (
          <section aria-labelledby="obj-fitness">
            <SectionHeading id="obj-fitness">Fitness</SectionHeading>
            <div className="flex flex-col gap-4">
              {fitness.map(g => (
                <ObjectifCard key={g.id} goal={g} today={today} />
              ))}
            </div>
          </section>
        )}

      </div>
    </PageLayout>
  )
}
