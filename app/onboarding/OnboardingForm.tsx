'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { completeOnboarding } from '@/app/actions/auth'

// ── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  program: string
  semesterStart: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const STEP_TITLES = ['Infos de base', 'Confirmation']
const TOTAL_STEPS = 2

// ── Styling constants ──────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '8px',
  display: 'block',
}

// ── Helper components ──────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="font-space-grotesk" style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function OnboardingForm({ name }: { name: string }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    name,
    program: '',
    semesterStart: '',
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  // ── Form helpers ──

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Navigation ──

  function validateStep(): string | null {
    if (step === 1 && form.name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères.'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(undefined)
    setStep(s => s + 1)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await completeOnboarding({
        name:          form.name.trim(),
        program:       form.program,
        semesterStart: form.semesterStart,
      })
      if (result?.error) setError(result.error)
    })
  }

  // ── Step content ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 1: Infos de base ────────────────────────────────────────────
      case 1:
        return (
          <div className="flex flex-col gap-8">
            <Field label="Ton nom">
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className="auth-input font-space-grotesk"
                placeholder="Ton prénom et nom"
                autoFocus
              />
            </Field>
            <Field label="Programme d'études">
              <input
                type="text"
                value={form.program}
                onChange={e => setField('program', e.target.value)}
                className="auth-input font-space-grotesk"
                placeholder="Ex : Génie logiciel, Droit, Médecine..."
              />
            </Field>
            <Field label="Début du semestre">
              <input
                type="date"
                value={form.semesterStart}
                onChange={e => setField('semesterStart', e.target.value)}
                className="auth-input font-space-grotesk"
              />
            </Field>
          </div>
        )

      // ── Step 2: Confirmation ─────────────────────────────────────────────
      case 2:
        return (
          <p className="font-space-grotesk text-center" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
            Tout est prêt, {form.name.trim().split(' ')[0] || form.name} ! Tu peux maintenant ajouter tes cours dans l&apos;agenda.
          </p>
        )

      default:
        return null
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0d0118 40%, #1a0535 70%, #2d0a4e 100%)',
      }}
    >
      <div className="w-full" style={{ maxWidth: '480px' }}>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <Image
            src="/assets/bear_no_background.png"
            alt=""
            aria-hidden
            width={100}
            height={100}
            className="object-contain"
            priority
          />

          <div style={{ textAlign: 'center' }}>
            <h1
              className="font-syne font-bold"
              style={{ fontSize: '24px', color: 'white', lineHeight: '1.2' }}
            >
              {step === 1 ? `Bienvenue, ${form.name} !` : STEP_TITLES[step - 1]}
            </h1>
            <p
              className="font-space-grotesk"
              style={{
                color: 'rgba(255,255,255,0.33)',
                fontSize: '12px',
                letterSpacing: '0.1em',
                marginTop: '8px',
              }}
            >
              Étape {step} sur {TOTAL_STEPS}
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: '2px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '1px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(to right, #4E2A84, #C9006B)',
                transform: `scaleX(${step / TOTAL_STEPS})`,
                transformOrigin: 'left',
                transition: 'transform 400ms ease',
              }}
            />
          </div>
        </div>

        {/* ── Step content ── */}
        <div style={{ marginBottom: '32px' }}>{renderStep()}</div>

        {/* ── Error ── */}
        {error && (
          <p
            role="alert"
            className="font-space-grotesk"
            style={{ fontSize: '13px', color: '#FF6B9D', marginBottom: '16px' }}
          >
            {error}
          </p>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLastStep ? (
            <button
              type="button"
              onClick={next}
              className="auth-submit-btn font-space-grotesk"
              style={{ height: '52px' }}
            >
              Suivant
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="auth-submit-btn font-space-grotesk"
              style={{ height: '52px' }}
            >
              {pending ? 'Enregistrement…' : "Accéder à l'agenda"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
