'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SyllabusImporterProps {
  courseId: string
  courseName: string
}

interface ImportResult {
  topicsExtracted: number
  evaluationsExtracted: number
  deadlinesCreated: number
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function SyllabusImporter({ courseId, courseName }: SyllabusImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()
  const [status, setStatus]       = useState<Status>('idle')
  const [result, setResult]       = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const [dragging, setDragging]   = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setErrorMsg('Seuls les fichiers PDF sont acceptés.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setResult(null)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch(`/api/academique/${courseId}/import-syllabus`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Erreur serveur')
        setStatus('error')
        return
      }

      setResult(json.data)
      setStatus('success')
      router.refresh()
    } catch {
      setErrorMsg('Erreur réseau — réessaie.')
      setStatus('error')
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Importer le syllabus PDF pour ${courseName}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--color-accent-study)' : 'var(--color-border-subtle)'}`,
          background: dragging ? 'rgba(74,158,255,0.05)' : 'var(--color-bg-elevated)',
          borderRadius: '12px',
          padding: '24px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          {status === 'loading'
            ? 'Extraction en cours…'
            : 'Glisse un PDF ici ou clique pour choisir'}
        </p>
        <p className="font-space-grotesk text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Plan de cours · Syllabus · PDF uniquement
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={onFileInput}
          aria-hidden="true"
        />
      </div>

      {/* Success */}
      {status === 'success' && result && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--color-accent-rec)', background: 'rgba(168,255,120,0.05)' }}
          role="status"
        >
          <p className="font-syne font-bold text-[13px]" style={{ color: 'var(--color-accent-rec)' }}>
            Syllabus importé
          </p>
          <ul className="font-space-grotesk text-[12px] mt-2 flex flex-col gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <li>{result.topicsExtracted} sujet{result.topicsExtracted !== 1 ? 's' : ''} extrait{result.topicsExtracted !== 1 ? 's' : ''}</li>
            <li>{result.evaluationsExtracted} évaluation{result.evaluationsExtracted !== 1 ? 's' : ''} détectée{result.evaluationsExtracted !== 1 ? 's' : ''}</li>
            <li>{result.deadlinesCreated} échéance{result.deadlinesCreated !== 1 ? 's' : ''} créée{result.deadlinesCreated !== 1 ? 's' : ''}</li>
          </ul>
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
