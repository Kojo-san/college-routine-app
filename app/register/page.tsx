'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <AuthLayout>
      <div
        className="w-full bg-bg-surface border border-border-subtle rounded-2xl p-8 flex flex-col gap-6"
        style={{ boxShadow: '0 0 40px rgba(74, 158, 255, 0.08)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-syne font-bold text-xl text-text-primary">Créer un compte</h1>
          <p className="font-space-grotesk text-sm text-text-muted">Commence à optimiser ton parcours</p>
        </div>

        {/* Form */}
        <form action={action} className="flex flex-col gap-4">
          <Input
            label="Prénom et nom"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus
            required
            placeholder="Marie Dupont"
            error={state?.errors?.name?.[0]}
          />
          <Input
            label="Courriel"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="prenom@universite.ca"
            error={state?.errors?.email?.[0]}
          />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="8 caractères minimum"
            error={state?.errors?.password?.[0]}
          />

          {state?.message && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full justify-center mt-1">
            {pending ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="font-space-grotesk text-sm text-center text-text-muted">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-accent-study hover:underline focus-ring rounded">
            Se connecter
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
