import { PageLayout } from '@/components/layout/PageLayout'
import { EtatCard } from '@/components/ui/EtatCard'
import { HealthHistoryChart } from '@/components/ui/HealthHistoryChart'
import { SleepForm, ActivityForm, HeartRateForm } from '@/components/ui/HealthForms'
import { AppleHealthImporter } from '@/components/ui/AppleHealthImporter'
import { getHealthData, getHealthHistory } from '@/lib/health'
import prisma from '@/lib/prisma'

async function getFirstUser(): Promise<{ id: string; name: string } | null> {
  const user = await prisma.user.findFirst({ select: { id: true, name: true } })
  return user ?? null
}

function todayDateLabel(): string {
  return new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-syne font-bold text-[18px] text-text-primary mb-4">
      {children}
    </h2>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
      {children}
    </div>
  )
}

export default async function SantePage() {
  const user   = await getFirstUser()
  const userId = user?.id ?? null
  const today  = new Date()
  today.setHours(0, 0, 0, 0)

  const [healthData, history] = await Promise.all([
    userId ? getHealthData(userId, today) : Promise.resolve(null),
    userId ? getHealthHistory(userId, 7, today) : Promise.resolve([]),
  ])
  const dateLabel  = todayDateLabel()
  const dateISO    = todayISO()

  // Prépare les props pour EtatCard si l'État est calculé
  const etatProps =
    healthData?.recovery && healthData?.cognitive && healthData?.sleep
      ? {
          date: dateLabel,
          physical: {
            recovery:        healthData.recovery.value,
            physicalFatigue: healthData.recovery.physicalFatigue,
            sleepDebt:       healthData.recovery.sleepDebt,
          },
          cognitive: {
            focus:            healthData.cognitive.focusLevel,
            cognitiveFatigue: healthData.cognitive.mentalFatigue,
            stress:           healthData.cognitive.stressLevel,
            motivation:       healthData.cognitive.motivationLevel,
          },
          sleep: {
            durationHours: healthData.sleep.sleepDurationHours,
            efficiency:    healthData.sleep.sleepEfficiency,
          },
        }
      : null

  return (
    <PageLayout title="Santé" etudiantNom={user?.name ?? undefined}>
      <div className="flex flex-col gap-8 max-w-2xl">

        {/* ── Historique 7 jours ── */}
        {history.length > 0 && (
          <section aria-labelledby="sante-historique">
            <SectionHeading id="sante-historique">7 derniers jours</SectionHeading>
            <HealthHistoryChart history={history} />
          </section>
        )}

        {/* ── État du jour ── */}
        <section aria-labelledby="sante-etat">
          <SectionHeading id="sante-etat">État du jour</SectionHeading>
          {etatProps ? (
            <EtatCard {...etatProps} />
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-8 flex flex-col items-center gap-3 text-center">
              <h2 className="font-syne font-bold text-[17px] text-text-primary">
                Aucun État calculé
              </h2>
              <p className="font-space-grotesk text-[13px] text-text-muted max-w-xs leading-relaxed">
                Saisis au moins le sommeil et l'activité du jour pour calculer ton État physique et cognitif.
              </p>
            </div>
          )}
        </section>

        {/* ── Signaux manuels ── */}
        <section aria-labelledby="sante-signaux">
          <SectionHeading id="sante-signaux">Saisie des Signaux</SectionHeading>
          <div className="flex flex-col gap-4">

            <FormCard>
              <h3 className="font-syne font-bold text-[15px] text-text-primary mb-1">
                Sommeil
              </h3>
              <p className="font-space-grotesk text-[12px] text-text-muted mb-4">
                Durée totale · efficacité · proportion de sommeil profond
              </p>
              <SleepForm date={dateISO} />
            </FormCard>

            <FormCard>
              <h3 className="font-syne font-bold text-[15px] text-text-primary mb-1">
                Activité physique
              </h3>
              <p className="font-space-grotesk text-[12px] text-text-muted mb-4">
                Pas · calories actives · durée d'entraînement
              </p>
              <ActivityForm date={dateISO} />
            </FormCard>

            <FormCard>
              <h3 className="font-syne font-bold text-[15px] text-text-primary mb-1">
                Fréquence cardiaque
              </h3>
              <p className="font-space-grotesk text-[12px] text-text-muted mb-4">
                FC repos · FC moyenne journée
              </p>
              <HeartRateForm date={dateISO} />
            </FormCard>

          </div>
        </section>

        {/* ── Import Apple Health ── */}
        <section aria-labelledby="sante-import">
          <SectionHeading id="sante-import">Import Apple Santé</SectionHeading>
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
            <AppleHealthImporter />
          </div>
        </section>

      </div>
    </PageLayout>
  )
}
