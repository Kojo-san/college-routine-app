'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '8px',
  display: 'block',
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <AuthLayout>
      {/* Subtitle */}
      <p
        className="font-space-grotesk"
        style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '44px' }}
      >
        Connexion à ton espace
      </p>

      <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="font-space-grotesk" style={LABEL_STYLE}>
            Courriel
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="prenom@universite.ca"
            className="auth-input font-space-grotesk"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="font-space-grotesk" style={LABEL_STYLE}>
            Mot de passe
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="auth-input font-space-grotesk"
          />
        </div>

        {state?.error && (
          <p
            role="alert"
            className="font-space-grotesk"
            style={{ fontSize: '13px', color: '#FF6B9D', marginTop: '-16px' }}
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="auth-submit-btn font-space-grotesk"
          style={{ marginTop: '8px' }}
        >
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p
        className="font-space-grotesk text-center"
        style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '28px' }}
      >
        Pas encore de compte ?{' '}
        <Link href="/register" style={{ color: '#C9006B' }}>
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  )
}
