import { PageLayout } from '@/components/layout/PageLayout'

export default function SettingsPage() {
  return (
    <PageLayout title="Réglages">
      <div className="flex flex-col gap-6 max-w-2xl">
        <p className="font-space-grotesk text-[14px] text-text-muted">
          Les réglages arrivent prochainement.
        </p>
      </div>
    </PageLayout>
  )
}
