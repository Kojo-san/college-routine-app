'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { completeOnboarding } from '@/app/actions/auth'
import type { GymPreferencesInput, ExtraActivity } from '@/app/actions/auth'

// ── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  program: string
  semesterStart: string
  wakeTime: string
  sleepTime: string
  includeGym: boolean
  gymPreferences: GymPreferencesInput
  extraActivities: (ExtraActivity & { id: string })[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const STEP_TITLES = [
  'Infos de base',
  'Horaires de sommeil',
  'Entraînement physique',
  'Activités extra-universitaires',
  'Confirmation',
]
const TOTAL_STEPS = 5

const GYM_TIMES      = ['Matin', 'Midi', 'Après-midi', 'Soir']
const WEEK_DAYS      = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const GYM_DURATIONS  = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]
const ACTIVITY_TYPES     = ['Emploi', 'Bénévolat', 'Sport', 'Club', 'Autre']
const RECURRENCE_OPTIONS = ['Chaque semaine', 'Aux deux semaines', 'Variable']

const DEFAULT_GYM: GymPreferencesInput = {
  sessionsPerWeek: 3,
  sessionDuration: 60,
  preferredTimes:  [],
  daysToAvoid:     [],
}

// ── Styling constants ──────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.6)',
  marginBottom: '8px',
  display: 'block',
}

const MUTED_TEXT: React.CSSProperties = {
  fontSize: '14px',
  color: 'rgba(255,255,255,0.5)',
  lineHeight: '1.6',
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

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-space-grotesk"
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        border: selected ? 'none' : '1px solid rgba(255,255,255,0.25)',
        background: selected ? 'linear-gradient(135deg, #4E2A84, #C9006B)' : 'transparent',
        color: selected ? 'white' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      {label}
    </button>
  )
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}
    >
      <p
        className="font-space-grotesk"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="font-space-grotesk" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </span>
      <span className="font-space-grotesk font-medium text-right" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
        {value}
      </span>
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
    wakeTime: '07:00',
    sleepTime: '23:00',
    includeGym: false,
    gymPreferences: { ...DEFAULT_GYM },
    extraActivities: [],
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityDraft, setActivityDraft] = useState<Omit<ExtraActivity, never>>({
    name: '',
    type: 'Emploi',
    recurrence: 'Chaque semaine',
  })

  // ── Form helpers ──

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleChip(field: 'preferredTimes' | 'daysToAvoid', value: string) {
    setForm(f => {
      const arr = f.gymPreferences[field]
      return {
        ...f,
        gymPreferences: {
          ...f.gymPreferences,
          [field]: arr.includes(value)
            ? arr.filter(v => v !== value)
            : [...arr, value],
        },
      }
    })
  }

  function addActivity() {
    if (!activityDraft.name.trim()) return
    setForm(f => ({
      ...f,
      extraActivities: [
        ...f.extraActivities,
        { ...activityDraft, name: activityDraft.name.trim(), id: crypto.randomUUID() },
      ],
    }))
    setActivityDraft({ name: '', type: 'Emploi', recurrence: 'Chaque semaine' })
    setShowActivityForm(false)
  }

  function removeActivity(id: string) {
    setForm(f => ({ ...f, extraActivities: f.extraActivities.filter(a => a.id !== id) }))
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

  function prev() {
    setError(undefined)
    setStep(s => s - 1)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await completeOnboarding({
        name:            form.name.trim(),
        program:         form.program,
        semesterStart:   form.semesterStart,
        wakeTime:        form.wakeTime,
        sleepTime:       form.sleepTime,
        includeGym:      form.includeGym,
        gymPreferences:  form.includeGym ? form.gymPreferences : null,
        extraActivities: form.extraActivities.map(({ id: _id, ...a }) => a),
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

      // ── Step 2: Horaires de sommeil ──────────────────────────────────────
      case 2:
        return (
          <div className="flex flex-col gap-8">
            <p className="font-space-grotesk" style={MUTED_TEXT}>
              Ces horaires seront utilisés pour afficher les blocs de sommeil dans ton agenda.
            </p>
            <Field label="À quelle heure tu te couches généralement ?">
              <input
                type="time"
                value={form.sleepTime}
                onChange={e => setField('sleepTime', e.target.value)}
                className="auth-input font-space-grotesk"
              />
            </Field>
            <Field label="À quelle heure tu te lèves généralement ?">
              <input
                type="time"
                value={form.wakeTime}
                onChange={e => setField('wakeTime', e.target.value)}
                className="auth-input font-space-grotesk"
              />
            </Field>
          </div>
        )

      // ── Step 3: Entraînement physique ────────────────────────────────────
      case 3:
        return (
          <div className="flex flex-col gap-6">
            <p className="font-space-grotesk" style={MUTED_TEXT}>
              Est-ce que tu veux intégrer l&apos;entraînement physique à ton agenda ?
            </p>

            {/* YES / NO toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([true, false] as const).map(val => {
                const active = form.includeGym === val
                return (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setField('includeGym', val)}
                    className="font-syne font-bold"
                    style={{
                      height: '48px',
                      borderRadius: '24px',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.25)',
                      background: active
                        ? 'linear-gradient(135deg, #4E2A84, #C9006B)'
                        : 'transparent',
                      color: active ? 'white' : 'rgba(255,255,255,0.6)',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {val ? 'Oui' : 'Non'}
                  </button>
                )
              })}
            </div>

            {/* Gym preferences — revealed on YES */}
            {form.includeGym && (
              <div
                className="flex flex-col gap-6"
                style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Field label="Combien de séances par semaine ?">
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map(n => {
                      const active = form.gymPreferences.sessionsPerWeek === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setForm(f => ({
                              ...f,
                              gymPreferences: { ...f.gymPreferences, sessionsPerWeek: n },
                            }))
                          }
                          className="font-space-grotesk font-bold"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '4px',
                            border: active ? 'none' : '1px solid rgba(255,255,255,0.25)',
                            background: active
                              ? 'linear-gradient(135deg, #4E2A84, #C9006B)'
                              : 'transparent',
                            color: active ? 'white' : 'rgba(255,255,255,0.5)',
                            fontSize: '14px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 200ms ease',
                          }}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                <Field label="Durée typique d'une séance ?">
                  <select
                    value={form.gymPreferences.sessionDuration}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        gymPreferences: { ...f.gymPreferences, sessionDuration: parseInt(e.target.value) },
                      }))
                    }
                    className="auth-input font-space-grotesk"
                  >
                    {GYM_DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </Field>

                <div>
                  <label className="font-space-grotesk" style={LABEL_STYLE}>Moments préférés ?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {GYM_TIMES.map(t => (
                      <Chip
                        key={t}
                        label={t}
                        selected={form.gymPreferences.preferredTimes.includes(t)}
                        onClick={() => toggleChip('preferredTimes', t)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-space-grotesk" style={LABEL_STYLE}>Jours à éviter ?</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {WEEK_DAYS.map(d => (
                      <Chip
                        key={d}
                        label={d}
                        selected={form.gymPreferences.daysToAvoid.includes(d)}
                        onClick={() => toggleChip('daysToAvoid', d)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      // ── Step 4: Activités extra-universitaires ───────────────────────────
      case 4:
        return (
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-space-grotesk" style={MUTED_TEXT}>
                Est-ce que tu as d&apos;autres activités régulières en dehors des cours ?
              </p>
              <p
                className="font-space-grotesk"
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}
              >
                Ex : job étudiant, bénévolat, club, sport d&apos;équipe...
              </p>
            </div>

            {/* Activity cards */}
            {form.extraActivities.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.extraActivities.map(activity => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#ffffff08',
                      border: '1px solid #ffffff15',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <p
                        className="font-space-grotesk font-medium"
                        style={{ fontSize: '14px', color: 'white' }}
                      >
                        {activity.name}
                      </p>
                      <p
                        className="font-space-grotesk"
                        style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}
                      >
                        {activity.type} · {activity.recurrence}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeActivity(activity.id)}
                      aria-label={`Supprimer ${activity.name}`}
                      className="ob-remove-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        lineHeight: 1,
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)',
                        flexShrink: 0,
                        padding: '4px 6px',
                        transition: 'color 200ms ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C9006B' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline activity form OR add button */}
            {showActivityForm ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  padding: '20px 16px',
                  background: '#ffffff08',
                  border: '1px solid #ffffff15',
                  borderRadius: '8px',
                }}
              >
                <Field label="Nom de l'activité">
                  <input
                    type="text"
                    value={activityDraft.name}
                    onChange={e => setActivityDraft(d => ({ ...d, name: e.target.value }))}
                    className="auth-input font-space-grotesk"
                    placeholder="Ex : Job chez Tim Hortons"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivity() } }}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Field label="Type">
                    <select
                      value={activityDraft.type}
                      onChange={e => setActivityDraft(d => ({ ...d, type: e.target.value }))}
                      className="auth-input font-space-grotesk"
                    >
                      {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Récurrence">
                    <select
                      value={activityDraft.recurrence}
                      onChange={e => setActivityDraft(d => ({ ...d, recurrence: e.target.value }))}
                      className="auth-input font-space-grotesk"
                    >
                      {RECURRENCE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityForm(false)
                      setActivityDraft({ name: '', type: 'Emploi', recurrence: 'Chaque semaine' })
                    }}
                    className="font-space-grotesk hover:underline"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '8px 12px',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={addActivity}
                    disabled={!activityDraft.name.trim()}
                    className="auth-submit-btn font-space-grotesk"
                    style={{ width: 'auto', height: '36px', padding: '0 20px', fontSize: '13px' }}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowActivityForm(true)}
                className="ob-add-activity-btn font-space-grotesk"
              >
                <span style={{ fontSize: '18px', lineHeight: 1, fontWeight: 300 }}>+</span>
                Ajouter une activité
              </button>
            )}
          </div>
        )

      // ── Step 5: Confirmation ─────────────────────────────────────────────
      case 5:
        return (
          <div className="flex flex-col gap-3">
            <p
              className="font-space-grotesk"
              style={{ ...MUTED_TEXT, fontSize: '13px', marginBottom: '4px' }}
            >
              Voici un résumé de tes préférences. Tu pourras tout modifier dans les réglages.
            </p>

            <SummarySection title="Infos de base">
              <SummaryRow label="Nom" value={form.name} />
              {form.program && <SummaryRow label="Programme" value={form.program} />}
              {form.semesterStart && <SummaryRow label="Début du semestre" value={form.semesterStart} />}
            </SummarySection>

            <SummarySection title="Sommeil">
              <SummaryRow label="Coucher" value={form.sleepTime} />
              <SummaryRow label="Réveil"  value={form.wakeTime} />
            </SummarySection>

            <SummarySection title="Entraînement physique">
              {form.includeGym ? (
                <>
                  <SummaryRow
                    label="Séances / semaine"
                    value={String(form.gymPreferences.sessionsPerWeek)}
                  />
                  <SummaryRow
                    label="Durée"
                    value={`${form.gymPreferences.sessionDuration} min`}
                  />
                  {form.gymPreferences.preferredTimes.length > 0 && (
                    <SummaryRow label="Moments" value={form.gymPreferences.preferredTimes.join(', ')} />
                  )}
                  {form.gymPreferences.daysToAvoid.length > 0 && (
                    <SummaryRow label="Jours à éviter" value={form.gymPreferences.daysToAvoid.join(', ')} />
                  )}
                </>
              ) : (
                <p
                  className="font-space-grotesk"
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
                >
                  Non inclus
                </p>
              )}
            </SummarySection>

            <SummarySection title="Activités extra-universitaires">
              {form.extraActivities.length > 0 ? (
                form.extraActivities.map(a => (
                  <SummaryRow key={a.id} label={a.name} value={`${a.type} · ${a.recurrence}`} />
                ))
              ) : (
                <p
                  className="font-space-grotesk"
                  style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
                >
                  Aucune
                </p>
              )}
            </SummarySection>
          </div>
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
            src="/assets/bear_no_background.PNG"
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
                width: `${(step / TOTAL_STEPS) * 100}%`,
                background: 'linear-gradient(to right, #4E2A84, #C9006B)',
                transition: 'width 400ms ease',
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
          {step > 1 && (
            <button
              type="button"
              onClick={prev}
              disabled={pending}
              className="font-space-grotesk hover:underline"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '13px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                padding: 0,
              }}
            >
              ← Précédent
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={next}
              className="auth-submit-btn font-space-grotesk"
              style={{ height: '52px' }}
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="auth-submit-btn font-space-grotesk"
              style={{ height: '52px' }}
            >
              {pending ? 'Enregistrement…' : 'Commencer mon Planning →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
