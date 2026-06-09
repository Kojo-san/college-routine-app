'use client'

import { useState, useTransition } from 'react'
import { logout, deleteAccount } from '@/app/actions/auth'

// ── Types ──────────────────────────────────────────────────────────────────

interface GymPreferences {
  sessionsPerWeek: number
  sessionDuration: number
  preferredTimes: string[]
  daysToAvoid: string[]
}

interface ExtraActivity {
  name: string
  type: string
  recurrence: string
}

interface UserData {
  name: string
  program: string | null
  wakeTime: string | null
  sleepTime: string | null
  includeGym: boolean
  gymPreferences: unknown
  extraActivities: unknown
}

// ── Constants ──────────────────────────────────────────────────────────────

const GYM_TIMES    = ['Matin', 'Midi', 'Après-midi', 'Soir']
const WEEK_DAYS    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const GYM_DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]
const ACTIVITY_TYPES     = ['Emploi', 'Bénévolat', 'Sport', 'Club', 'Autre']
const RECURRENCE_OPTIONS = ['Chaque semaine', 'Aux deux semaines', 'Variable']

function parseGymPrefs(raw: unknown): GymPreferences {
  const d = raw as Record<string, unknown> | null
  return {
    sessionsPerWeek: (typeof d?.sessionsPerWeek === 'number' ? d.sessionsPerWeek : 3),
    sessionDuration: (typeof d?.sessionDuration === 'number' ? d.sessionDuration : 60),
    preferredTimes:  (Array.isArray(d?.preferredTimes) ? d.preferredTimes as string[] : []),
    daysToAvoid:     (Array.isArray(d?.daysToAvoid) ? d.daysToAvoid as string[] : []),
  }
}

function parseActivities(raw: unknown): (ExtraActivity & { id: string })[] {
  if (!Array.isArray(raw)) return []
  return raw.map((a, i) => ({
    id: String(i),
    name: String((a as Record<string, unknown>).name ?? ''),
    type: String((a as Record<string, unknown>).type ?? 'Autre'),
    recurrence: String((a as Record<string, unknown>).recurrence ?? 'Chaque semaine'),
  }))
}

// ── Styling helpers ────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-subtle ' +
  'font-space-grotesk text-sm text-text-primary placeholder:text-text-muted ' +
  'focus:outline-none focus:border-[#C9006B]/70 focus:ring-1 focus:ring-[#C9006B]/20 transition-colors'

const labelCls = 'block font-space-grotesk text-[13px] font-medium text-text-muted mb-1'

const sectionCls =
  'bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4'

const sectionTitleCls = 'font-syne font-bold text-[16px] text-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded-full text-[12px] font-space-grotesk font-medium transition-all border cursor-pointer ' +
        (selected
          ? 'bg-[#C9006B] text-white border-[#C9006B]'
          : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#C9006B]/50')
      }
    >
      {label}
    </button>
  )
}

function SaveButton({ pending, label = 'Enregistrer' }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-end px-5 py-2 app-btn-primary rounded-lg font-space-grotesk text-[13px] font-medium cursor-pointer"
    >
      {pending ? 'Enregistrement…' : label}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function SettingsClient({ user }: { user: UserData }) {
  // ── Section 1: Profil ──
  const [profileName, setProfileName]       = useState(user.name)
  const [profileProgram, setProfileProgram] = useState(user.program ?? '')
  const [profilePending, startProfileTrans] = useTransition()
  const [profileMsg, setProfileMsg]         = useState<string | undefined>()

  // ── Section 2: Sommeil ──
  const [sleepTime, setSleepTime] = useState(user.sleepTime ?? '23:00')
  const [wakeTime, setWakeTime]   = useState(user.wakeTime ?? '07:00')
  const [sleepPending, startSleepTrans] = useTransition()
  const [sleepMsg, setSleepMsg]         = useState<string | undefined>()

  // ── Section 3: Gym ──
  const [includeGym, setIncludeGym]   = useState(user.includeGym)
  const [gymPrefs, setGymPrefs]       = useState<GymPreferences>(() => parseGymPrefs(user.gymPreferences))
  const [gymPending, startGymTrans]   = useTransition()
  const [gymMsg, setGymMsg]           = useState<string | undefined>()

  // ── Section 4: Activités ──
  const [activities, setActivities]             = useState(() => parseActivities(user.extraActivities))
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityDraft, setActivityDraft]       = useState<ExtraActivity>({
    name: '', type: 'Emploi', recurrence: 'Chaque semaine',
  })
  const [actPending, startActTrans] = useTransition()
  const [actMsg, setActMsg]         = useState<string | undefined>()

  // ── Section 5: Compte ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Helpers ──

  async function patchUser(data: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) return { ok: false, error: json.error ?? 'Erreur inconnue.' }
    return { ok: true }
  }

  function toggleGymChip(field: 'preferredTimes' | 'daysToAvoid', value: string) {
    setGymPrefs(p => ({
      ...p,
      [field]: p[field].includes(value) ? p[field].filter(v => v !== value) : [...p[field], value],
    }))
  }

  function addActivity() {
    if (!activityDraft.name.trim()) return
    setActivities(prev => [...prev, { ...activityDraft, id: crypto.randomUUID() }])
    setActivityDraft({ name: '', type: 'Emploi', recurrence: 'Chaque semaine' })
    setShowActivityForm(false)
  }

  function removeActivity(id: string) {
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  // ── Submit handlers ──

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    startProfileTrans(async () => {
      setProfileMsg(undefined)
      const { ok, error } = await patchUser({ name: profileName.trim(), program: profileProgram })
      setProfileMsg(ok ? '✓ Sauvegardé' : error)
    })
  }

  function handleSleepSave(e: React.FormEvent) {
    e.preventDefault()
    startSleepTrans(async () => {
      setSleepMsg(undefined)
      const { ok, error } = await patchUser({ wakeTime, sleepTime })
      setSleepMsg(ok ? '✓ Sauvegardé' : error)
    })
  }

  function handleGymSave(e: React.FormEvent) {
    e.preventDefault()
    startGymTrans(async () => {
      setGymMsg(undefined)
      const { ok, error } = await patchUser({
        includeGym,
        gymPreferences: includeGym ? gymPrefs : null,
      })
      setGymMsg(ok ? '✓ Sauvegardé' : error)
    })
  }

  function handleActSave(e: React.FormEvent) {
    e.preventDefault()
    startActTrans(async () => {
      setActMsg(undefined)
      const toSave = activities.map(({ id: _id, ...a }) => a)
      const { ok, error } = await patchUser({ extraActivities: toSave })
      setActMsg(ok ? '✓ Sauvegardé' : error)
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Section 1: Profil ── */}
      <form onSubmit={handleProfileSave} className={sectionCls}>
        <h2 className={sectionTitleCls}>Profil</h2>

        <Field label="Nom affiché">
          <input
            type="text"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            className={inputCls}
            placeholder="Ton prénom et nom"
            minLength={2}
            required
          />
        </Field>

        <Field label="Programme / filière">
          <input
            type="text"
            value={profileProgram}
            onChange={e => setProfileProgram(e.target.value)}
            className={inputCls}
            placeholder="Ex : Génie logiciel, Droit…"
          />
        </Field>

        {profileMsg && (
          <p className={`font-space-grotesk text-[13px] ${profileMsg.startsWith('✓') ? 'text-[#A8FF78]' : 'text-red-400'}`}>
            {profileMsg}
          </p>
        )}
        <SaveButton pending={profilePending} />
      </form>

      {/* ── Section 2: Sommeil ── */}
      <form onSubmit={handleSleepSave} className={sectionCls}>
        <h2 className={sectionTitleCls}>Horaires de sommeil</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Heure de coucher">
            <input
              type="time"
              value={sleepTime}
              onChange={e => setSleepTime(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Heure de réveil">
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {sleepMsg && (
          <p className={`font-space-grotesk text-[13px] ${sleepMsg.startsWith('✓') ? 'text-[#A8FF78]' : 'text-red-400'}`}>
            {sleepMsg}
          </p>
        )}
        <SaveButton pending={sleepPending} />
      </form>

      {/* ── Section 3: Gym ── */}
      <form onSubmit={handleGymSave} className={sectionCls}>
        <h2 className={sectionTitleCls}>Entraînement physique</h2>

        <div className="flex items-center justify-between gap-4">
          <label className="font-space-grotesk text-[14px] text-text-primary">
            Inclure l&apos;entraînement dans l&apos;agenda
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={includeGym}
            onClick={() => setIncludeGym(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${includeGym ? 'bg-[#C9006B]' : 'bg-bg-elevated border border-border-subtle'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${includeGym ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {includeGym && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border-subtle">

            <div>
              <p className={labelCls}>Séances par semaine</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGymPrefs(p => ({ ...p, sessionsPerWeek: n }))}
                    className={
                      'w-11 h-11 rounded-lg font-space-grotesk font-bold text-[14px] transition-all border flex-shrink-0 cursor-pointer ' +
                      (gymPrefs.sessionsPerWeek === n
                        ? 'bg-[#C9006B] text-white border-[#C9006B]'
                        : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#C9006B]/50')
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Durée typique d'une séance">
              <select
                value={gymPrefs.sessionDuration}
                onChange={e => setGymPrefs(p => ({ ...p, sessionDuration: parseInt(e.target.value) }))}
                className={inputCls}
              >
                {GYM_DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>

            <div>
              <p className={labelCls}>Moments préférés</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {GYM_TIMES.map(t => (
                  <Chip
                    key={t}
                    label={t}
                    selected={gymPrefs.preferredTimes.includes(t)}
                    onClick={() => toggleGymChip('preferredTimes', t)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className={labelCls}>Jours à éviter</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {WEEK_DAYS.map(d => (
                  <Chip
                    key={d}
                    label={d}
                    selected={gymPrefs.daysToAvoid.includes(d)}
                    onClick={() => toggleGymChip('daysToAvoid', d)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {gymMsg && (
          <p className={`font-space-grotesk text-[13px] ${gymMsg.startsWith('✓') ? 'text-[#A8FF78]' : 'text-red-400'}`}>
            {gymMsg}
          </p>
        )}
        <SaveButton pending={gymPending} />
      </form>

      {/* ── Section 4: Activités extra-universitaires ── */}
      <form onSubmit={handleActSave} className={sectionCls}>
        <h2 className={sectionTitleCls}>Activités extra-universitaires</h2>

        {activities.length > 0 && (
          <div className="flex flex-col gap-2">
            {activities.map(activity => (
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
                  className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors text-lg leading-none flex-shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

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
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowActivityForm(false)
                  setActivityDraft({ name: '', type: 'Emploi', recurrence: 'Chaque semaine' })
                }}
                className="px-4 py-2 font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={addActivity}
                disabled={!activityDraft.name.trim()}
                className="px-4 py-2 app-btn-primary rounded-lg font-space-grotesk text-[13px] font-medium cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowActivityForm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border-subtle text-text-muted hover:text-text-primary hover:border-[#C9006B]/50 transition-all font-space-grotesk text-[13px] cursor-pointer"
          >
            <span className="text-[18px] leading-none font-light">+</span>
            Ajouter une activité
          </button>
        )}

        {actMsg && (
          <p className={`font-space-grotesk text-[13px] ${actMsg.startsWith('✓') ? 'text-[#A8FF78]' : 'text-red-400'}`}>
            {actMsg}
          </p>
        )}
        <SaveButton pending={actPending} label="Enregistrer les activités" />
      </form>

      {/* ── Section 5: Compte ── */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>Compte</h2>

        <form action={logout}>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl border border-red-500/30 font-space-grotesk text-[14px] text-[#ff6b6b] hover:bg-red-400/10 hover:border-red-500/50 transition-all text-left cursor-pointer"
          >
            Se déconnecter
          </button>
        </form>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-3 rounded-xl border border-red-500/30 font-space-grotesk text-[14px] text-red-400 hover:bg-red-400/10 hover:border-red-500/60 transition-all text-left cursor-pointer"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="p-4 bg-red-400/10 border border-red-500/40 rounded-xl flex flex-col gap-3">
            <p className="font-space-grotesk text-[13px] text-text-primary">
              Cette action est irréversible. Toutes tes données seront supprimées.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border-subtle font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <form action={deleteAccount} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-space-grotesk text-[13px] font-medium hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Confirmer la suppression
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
