'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <AuthLayout>
      <div
        className="w-full bg-bg-surface border border-border-subtle rounded-2xl p-8 flex flex-col gap-6"
        style={{ boxShadow: '0 0 40px rgba(74, 158, 255, 0.08)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-syne font-bold text-xl text-text-primary">College Routine</h1>
          <p className="font-space-grotesk text-sm text-text-muted">Connexion à ton espace</p>
        </div>

        {/* Form */}
        <form action={action} className="flex flex-col gap-4">
          <Input
            label="Courriel"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="prenom@universite.ca"
          />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />

          {state?.error && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full justify-center mt-1">
            {pending ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="font-space-grotesk text-sm text-center text-text-muted">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-accent-study hover:underline focus-ring rounded">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
