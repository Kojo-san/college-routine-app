'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AppleHealthRecord } from '@/lib/applehealth'
import { parseAppleHealthExport } from '@/lib/applehealth'

type Status = 'idle' | 'preview' | 'loading' | 'success' | 'error'

export function AppleHealthImporter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  const [status, setStatus]       = useState<Status>('idle')
  const [records, setRecords]     = useState<AppleHealthRecord[]>([])
  const [imported, setImported]   = useState(0)
  const [errorMsg, setErrorMsg]   = useState('')

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        const parsed = parseAppleHealthExport(json)
        if (parsed.length === 0) {
          setErrorMsg('Aucun enregistrement valide trouvé dans ce fichier.')
          setStatus('error')
          return
        }
        setRecords(parsed)
        setStatus('preview')
        setErrorMsg('')
      } catch (err) {
        setErrorMsg((err as Error).message ?? 'JSON invalide')
        setStatus('error')
      }
    }
    reader.readAsText(file)
  }

  async function handleConfirm() {
    setStatus('loading')
    try {
      const res  = await fetch('/api/health/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Erreur serveur')
        setStatus('error')
        return
      }
      setImported(json.data.imported)
      setStatus('success')
      router.refresh()
    } catch {
      setErrorMsg('Erreur réseau — réessaie.')
      setStatus('error')
    }
  }

  const PREVIEW_MAX = 5

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-space-grotesk text-[12px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Importe un fichier JSON exporté depuis Apple Santé ou l'app College Routine (iOS).
          Format attendu : un tableau d'objets avec les champs{' '}
          <code className="text-[11px] px-1 rounded" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-accent-study)' }}>
            date, sleep?, activity?, heartRate?
          </code>
        </p>

        {(status === 'idle' || status === 'error') && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-space-grotesk text-[13px] font-medium px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'var(--color-border-subtle)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            Choisir un fichier JSON
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={onFileInput}
          aria-hidden="true"
        />
      </div>

      {/* Preview */}
      {status === 'preview' && records.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-space-grotesk text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>{records.length}</strong> enregistrement{records.length !== 1 ? 's' : ''} détecté{records.length !== 1 ? 's' : ''}
          </p>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <table className="w-full text-[11px] font-space-grotesk" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th className="text-left px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                  <th className="text-center px-2 py-2" style={{ color: 'var(--color-accent-study)' }}>Sommeil</th>
                  <th className="text-center px-2 py-2" style={{ color: 'var(--color-accent-fit)' }}>Activité</th>
                  <th className="text-center px-2 py-2" style={{ color: 'var(--color-accent-reco)' }}>FC</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, PREVIEW_MAX).map((r, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', background: i % 2 === 0 ? 'transparent' : 'var(--color-bg-elevated)' }}
                  >
                    <td className="px-3 py-1.5" style={{ color: 'var(--color-text-primary)' }}>{r.date}</td>
                    <td className="text-center px-2 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      {r.sleep ? `${r.sleep.durationHours}h` : '—'}
                    </td>
                    <td className="text-center px-2 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      {r.activity ? `${r.activity.steps} pas` : '—'}
                    </td>
                    <td className="text-center px-2 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      {r.heartRate ? `${r.heartRate.resting} bpm` : '—'}
                    </td>
                  </tr>
                ))}
                {records.length > PREVIEW_MAX && (
                  <tr>
                    <td colSpan={4} className="px-3 py-1.5 text-center" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                      + {records.length - PREVIEW_MAX} enregistrement{records.length - PREVIEW_MAX !== 1 ? 's' : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="font-space-grotesk text-[13px] font-medium px-5 py-2.5 rounded-lg"
              style={{ background: 'var(--color-accent-study)', color: '#0A0A14', cursor: 'pointer' }}
            >
              Importer {records.length} jour{records.length !== 1 ? 's' : ''}
            </button>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setRecords([]) }}
              className="font-space-grotesk text-[13px] px-4 py-2.5 rounded-lg border"
              style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)', cursor: 'pointer', background: 'transparent' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          Import en cours…
        </p>
      )}

      {/* Success */}
      {status === 'success' && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--color-accent-rec)', background: 'rgba(168,255,120,0.05)' }}
          role="status"
        >
          <p className="font-syne font-bold text-[13px]" style={{ color: 'var(--color-accent-rec)' }}>
            {imported} jour{imported !== 1 ? 's' : ''} importé{imported !== 1 ? 's' : ''}
          </p>
          <p className="font-space-grotesk text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Les signaux ont été ajoutés à ton historique Santé.
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <p
          className="font-space-grotesk text-[12px] px-3 py-2 rounded-lg"
          style={{ color: 'var(--color-accent-reco)', background: 'rgba(255,107,157,0.08)' }}
          role="alert"
        >
          {errorMsg}
        </p>
      )}
    </div>
  )
}
