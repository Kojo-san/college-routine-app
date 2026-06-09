'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register } from '@/app/actions/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '8px',
  display: 'block',
}

const FIELD_ERROR_STYLE: React.CSSProperties = {
  fontSize: '12px',
  color: '#FF6B9D',
  marginTop: '6px',
}

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <AuthLayout>
      {/* Subtitle */}
      <p
        className="font-space-grotesk"
        style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '44px' }}
      >
        Commence à optimiser ton parcours
      </p>

      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Full name */}
        <div>
          <label htmlFor="reg-name" className="font-space-grotesk" style={LABEL_STYLE}>
            Prénom et nom
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus
            required
            placeholder="Marie Dupont"
            className="auth-input font-space-grotesk"
          />
          {state?.errors?.name?.[0] && (
            <p role="alert" className="font-space-grotesk" style={FIELD_ERROR_STYLE}>
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="font-space-grotesk" style={LABEL_STYLE}>
            Courriel
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="prenom@universite.ca"
            className="auth-input font-space-grotesk"
          />
          {state?.errors?.email?.[0] && (
            <p role="alert" className="font-space-grotesk" style={FIELD_ERROR_STYLE}>
              {state.errors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="font-space-grotesk" style={LABEL_STYLE}>
            Mot de passe
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="8 caractères minimum"
            className="auth-input font-space-grotesk"
          />
          {state?.errors?.password?.[0] && (
            <p role="alert" className="font-space-grotesk" style={FIELD_ERROR_STYLE}>
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {state?.message && (
          <p
            role="alert"
            className="font-space-grotesk"
            style={{ fontSize: '13px', color: '#FF6B9D', marginTop: '-12px' }}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="auth-submit-btn font-space-grotesk"
          style={{ marginTop: '8px' }}
        >
          {pending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <p
        className="font-space-grotesk text-center"
        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '28px' }}
      >
        Déjà un compte ?{' '}
        <Link href="/login" style={{ color: '#C9006B' }}>
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}
