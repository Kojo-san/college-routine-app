'use client'

import Image from 'next/image'
import { useActionState } from 'react'
import { completeOnboarding } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function OnboardingForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined)

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl p-8 flex flex-col gap-6"
        style={{ boxShadow: '0 0 40px rgba(74, 158, 255, 0.08)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/assets/bear.png" alt="" aria-hidden width={72} height={72} className="object-contain" />
          <h1 className="font-syne font-bold text-xl text-text-primary">
            Bienvenue, {name} !
          </h1>
          <p className="font-space-grotesk text-sm text-text-muted text-center">
            Configure tes préférences pour que l'algorithme adapte ton planning.
          </p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          {/* Horaires */}
          <div className="flex flex-col gap-4">
            <h2 className="font-syne font-bold text-[15px] text-text-primary">Horaires quotidiens</h2>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Réveil"
                name="wakeTime"
                type="time"
                defaultValue="07:00"
                required
              />
              <Input
                label="Coucher"
                name="sleepTime"
                type="time"
                defaultValue="23:00"
                required
              />
            </div>

            <Input
              label="Entraînement (optionnel)"
              name="gymTime"
              type="time"
              placeholder="--:--"
            />
          </div>

          {/* Charge d'étude */}
          <div className="flex flex-col gap-2">
            <h2 className="font-syne font-bold text-[15px] text-text-primary">Charge d'étude</h2>
            <Input
              label="Heures d'étude max / jour"
              name="maxDailyStudyHours"
              type="number"
              min="1"
              max="16"
              step="0.5"
              defaultValue="6"
              required
            />
          </div>

          {state?.error && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full justify-center">
            {pending ? 'Enregistrement…' : 'Commencer mon Planning →'}
          </Button>
        </form>
      </div>
    </div>
  )
}
