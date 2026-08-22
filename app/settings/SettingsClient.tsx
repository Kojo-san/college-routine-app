'use client'

import { useState, useTransition } from 'react'
import { logout, deleteAccount } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'

// ── Types ──────────────────────────────────────────────────────────────────

interface UserData {
  name: string
  program: string | null
}

// ── Styling helpers ────────────────────────────────────────────────────────

const inputCls = 'auth-input font-space-grotesk text-sm'

const labelCls = 'block font-space-grotesk text-[13px] font-medium text-text-muted mb-1'

const sectionCls =
  'bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-4'

const sectionTitleCls =
  'font-space-grotesk text-[13px] font-medium tracking-[0.08em] uppercase mb-5'

const sectionTitleStyle = { color: 'rgba(255, 255, 255, 0.4)' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function SettingsClient({ user }: { user: UserData }) {
  // ── Section 1: Profil ──
  const [profileName, setProfileName]       = useState(user.name)
  const [profileProgram, setProfileProgram] = useState(user.program ?? '')
  const [profilePending, startProfileTrans] = useTransition()
  const [profileMsg, setProfileMsg]         = useState<string | undefined>()

  // ── Section 2: Compte ──
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

  // ── Submit handlers ──

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    startProfileTrans(async () => {
      setProfileMsg(undefined)
      const { ok, error } = await patchUser({ name: profileName.trim(), program: profileProgram })
      setProfileMsg(ok ? '✓ Sauvegardé' : error)
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Section 1: Profil ── */}
      <form onSubmit={handleProfileSave} className={sectionCls}>
        <h2 className={sectionTitleCls} style={sectionTitleStyle}>Profil</h2>

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
        <Button type="submit" variant="primary" size="sm" disabled={profilePending} className="self-end">
          {profilePending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>

      {/* ── Section 2: Compte ── */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls} style={sectionTitleStyle}>Compte</h2>

        <form action={logout}>
          <Button type="submit" variant="destructive" className="w-full justify-start">
            Se déconnecter
          </Button>
        </form>

        {!showDeleteConfirm ? (
          <Button type="button" variant="destructive" className="w-full justify-start" onClick={() => setShowDeleteConfirm(true)}>
            Supprimer mon compte
          </Button>
        ) : (
          <div className="p-4 bg-red-400/10 border border-red-500/40 rounded-xl flex flex-col gap-3">
            <p className="font-space-grotesk text-[13px] text-text-primary">
              Cette action est irréversible. Toutes tes données seront supprimées.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
              <form action={deleteAccount} className="flex-1">
                <Button type="submit" variant="destructive" size="sm" className="w-full">
                  Confirmer la suppression
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
