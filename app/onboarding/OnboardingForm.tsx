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

const GYM_TIMES   = ['Matin', 'Midi', 'Après-midi', 'Soir']
const WEEK_DAYS   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const GYM_DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]
const ACTIVITY_TYPES      = ['Emploi', 'Bénévolat', 'Sport', 'Club', 'Autre']
const RECURRENCE_OPTIONS  = ['Chaque semaine', 'Aux deux semaines', 'Variable']

const DEFAULT_GYM: GymPreferencesInput = {
  sessionsPerWeek: 3,
  sessionDuration: 60,
  preferredTimes:  [],
  daysToAvoid:     [],
}

// ── Styling helpers ────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-subtle ' +
  'font-space-grotesk text-sm text-text-primary placeholder:text-text-muted ' +
  'focus:outline-none focus:border-[#4A9EFF]/70 focus:ring-1 focus:ring-[#4A9EFF]/20 transition-colors'

const labelCls = 'block font-space-grotesk text-[13px] font-medium text-text-muted mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>{label}</label>
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
      className={
        'px-3 py-1.5 rounded-full text-[12px] font-space-grotesk font-medium transition-all border ' +
        (selected
          ? 'bg-[#4A9EFF] text-white border-[#4A9EFF]'
          : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#4A9EFF]/50')
      }
    >
      {label}
    </button>
  )
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-bg-elevated rounded-xl border border-border-subtle">
      <p className="font-syne font-bold text-[11px] text-text-muted uppercase tracking-wider mb-2">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="font-space-grotesk text-[13px] text-text-muted">{label}</span>
      <span className="font-space-grotesk text-[13px] text-text-primary font-medium text-right">{value}</span>
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

  // Activity draft state
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
          <div className="flex flex-col gap-4">
            <Field label="Ton nom">
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                className={inputCls}
                placeholder="Ton prénom et nom"
                autoFocus
              />
            </Field>
            <Field label="Programme d'études">
              <input
                type="text"
                value={form.program}
                onChange={e => setField('program', e.target.value)}
                className={inputCls}
                placeholder="Ex : Génie logiciel, Droit, Médecine..."
              />
            </Field>
            <Field label="Début du semestre">
              <input
                type="date"
                value={form.semesterStart}
                onChange={e => setField('semesterStart', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )

      // ── Step 2: Horaires de sommeil ──────────────────────────────────────
      case 2:
        return (
          <div className="flex flex-col gap-5">
            <p className="font-space-grotesk text-sm text-text-muted leading-relaxed">
              Ces horaires seront utilisés pour afficher les blocs de sommeil dans ton agenda.
            </p>
            <Field label="À quelle heure tu te couches généralement ?">
              <input
                type="time"
                value={form.sleepTime}
                onChange={e => setField('sleepTime', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="À quelle heure tu te lèves généralement ?">
              <input
                type="time"
                value={form.wakeTime}
                onChange={e => setField('wakeTime', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        )

      // ── Step 3: Entraînement physique ────────────────────────────────────
      case 3:
        return (
          <div className="flex flex-col gap-5">
            <p className="font-space-grotesk text-sm text-text-muted">
              Est-ce que tu veux intégrer l&apos;entraînement physique à ton agenda ?
            </p>

            {/* YES / NO */}
            <div className="grid grid-cols-2 gap-3">
              {([true, false] as const).map(val => {
                const active = form.includeGym === val
                return (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setField('includeGym', val)}
                    className={
                      'py-4 rounded-xl font-syne font-bold text-[15px] transition-all border ' +
                      (active
                        ? val
                          ? 'bg-[#4A9EFF] text-white border-[#4A9EFF]'
                          : 'bg-bg-elevated text-text-primary border-text-muted/40'
                        : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#4A9EFF]/40')
                    }
                  >
                    {val ? 'Oui ✓' : 'Non'}
                  </button>
                )
              })}
            </div>

            {/* Gym preferences — revealed on YES */}
            {form.includeGym && (
              <div className="flex flex-col gap-4 pt-2 border-t border-border-subtle">

                <Field label="Combien de séances par semaine ?">
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setForm(f => ({
                            ...f,
                            gymPreferences: { ...f.gymPreferences, sessionsPerWeek: n },
                          }))
                        }
                        className={
                          'w-11 h-11 rounded-lg font-space-grotesk font-bold text-[14px] transition-all border flex-shrink-0 ' +
                          (form.gymPreferences.sessionsPerWeek === n
                            ? 'bg-[#4A9EFF] text-white border-[#4A9EFF]'
                            : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#4A9EFF]/50')
                        }
                      >
                        {n}
                      </button>
                    ))}
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
                    className={inputCls}
                  >
                    {GYM_DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </Field>

                <div>
                  <p className={labelCls}>Moments préférés ?</p>
                  <div className="flex flex-wrap gap-2 mt-1">
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
                  <p className={labelCls}>Jours à éviter ?</p>
                  <div className="flex flex-wrap gap-2 mt-1">
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
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-space-grotesk text-sm text-text-muted leading-relaxed">
                Est-ce que tu as d&apos;autres activités régulières en dehors des cours ?
              </p>
              <p className="font-space-grotesk text-[12px] text-text-muted mt-1">
                Ex : job étudiant, bénévolat, club, sport d&apos;équipe...
              </p>
            </div>

            {/* Activity cards */}
            {form.extraActivities.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.extraActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-border-subtle"
                  >
                    <div>
                      <p className="font-space-grotesk font-medium text-[14px] text-text-primary">
                        {activity.name}
                      </p>
                      <p className="font-space-grotesk text-[12px] text-text-muted">
                        {activity.type} · {activity.recurrence}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeActivity(activity.id)}
                      aria-label={`Supprimer ${activity.name}`}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors text-lg leading-none flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline activity form OR add button */}
            {showActivityForm ? (
              <div className="flex flex-col gap-3 p-4 bg-bg-elevated rounded-xl border border-border-subtle">
                <Field label="Nom de l'activité">
                  <input
                    type="text"
                    value={activityDraft.name}
                    onChange={e => setActivityDraft(d => ({ ...d, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex : Job chez Tim Hortons"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivity() } }}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <select
                      value={activityDraft.type}
                      onChange={e => setActivityDraft(d => ({ ...d, type: e.target.value }))}
                      className={inputCls}
                    >
                      {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Récurrence">
                    <select
                      value={activityDraft.recurrence}
                      onChange={e => setActivityDraft(d => ({ ...d, recurrence: e.target.value }))}
                      className={inputCls}
                    >
                      {RECURRENCE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityForm(false)
                      setActivityDraft({ name: '', type: 'Emploi', recurrence: 'Chaque semaine' })
                    }}
                    className="px-4 py-2 font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={addActivity}
                    disabled={!activityDraft.name.trim()}
                    className="px-4 py-2 bg-[#4A9EFF] text-white rounded-lg font-space-grotesk text-[13px] font-medium disabled:opacity-40 hover:bg-[#3a8eef] transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowActivityForm(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:text-text-primary hover:border-[#4A9EFF]/50 transition-all font-space-grotesk text-[13px]"
              >
                <span className="text-[18px] leading-none font-light">+</span>
                Ajouter une activité
              </button>
            )}
          </div>
        )

      // ── Step 5: Confirmation ─────────────────────────────────────────────
      case 5:
        return (
          <div className="flex flex-col gap-3">
            <p className="font-space-grotesk text-sm text-text-muted leading-relaxed">
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
                <p className="font-space-grotesk text-[13px] text-text-muted italic">Non inclus</p>
              )}
            </SummarySection>

            <SummarySection title="Activités extra-universitaires">
              {form.extraActivities.length > 0 ? (
                form.extraActivities.map(a => (
                  <SummaryRow key={a.id} label={a.name} value={`${a.type} · ${a.recurrence}`} />
                ))
              ) : (
                <p className="font-space-grotesk text-[13px] text-text-muted italic">Aucune</p>
              )}
            </SummarySection>
          </div>
        )

      default:
        return null
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-2xl p-8 flex flex-col gap-5"
        style={{ boxShadow: '0 0 40px rgba(74, 158, 255, 0.08)' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/assets/bear.png"
            alt=""
            aria-hidden
            width={60}
            height={60}
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="font-syne font-bold text-xl text-text-primary">
              {step === 1 ? `Bienvenue, ${form.name} !` : STEP_TITLES[step - 1]}
            </h1>
            <p className="font-space-grotesk text-[12px] text-text-muted mt-1">
              Étape {step} sur {TOTAL_STEPS}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: 'linear-gradient(90deg, #4A9EFF, #a78bfa)',
            }}
          />
        </div>

        {/* Step content */}
        <div>{renderStep()}</div>

        {/* Error */}
        {error && (
          <p role="alert" className="font-space-grotesk text-[13px] text-red-400">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className={`flex gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button
              type="button"
              onClick={prev}
              disabled={pending}
              className="px-5 py-2.5 rounded-xl border border-border-subtle font-space-grotesk text-[14px] text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-all disabled:opacity-40"
            >
              ← Précédent
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              className="px-6 py-2.5 rounded-xl bg-[#4A9EFF] text-white font-space-grotesk text-[14px] font-medium hover:bg-[#3a8eef] transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="px-6 py-2.5 rounded-xl bg-[#4A9EFF] text-white font-space-grotesk text-[14px] font-medium hover:bg-[#3a8eef] transition-colors disabled:opacity-40"
            >
              {pending ? 'Enregistrement…' : 'Commencer mon Planning →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
