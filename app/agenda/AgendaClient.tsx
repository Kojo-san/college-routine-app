"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { EventManager, type Event, type EventManagerHandle } from "@/components/ui/event-manager"
import { CheckCircle2, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SerializedEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  color: string
  category?: string
  tags?: string[]
}

type GymPreferences = {
  sessionsPerWeek: number
  sessionDuration: number
  preferredTimes: string[]
  daysToAvoid: string[]
}

type SetupState = { step1: boolean; step2: boolean; step3: boolean }

type BannerVariant = "A" | "B" | "C"

interface AgendaClientProps {
  userId: string
  initialEvents: SerializedEvent[]
  includeGym: boolean
  gymPreferences?: unknown
  extraActivities?: unknown
}

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_COLORS = [
  { name: "Cours",          value: "cours",          bg: "bg-violet-600",  text: "text-violet-400" },
  { name: "Étude",          value: "study",          bg: "bg-purple-800",  text: "text-purple-400" },
  { name: "Fitness",        value: "fitness",        bg: "bg-[#FFD166]",   text: "text-[#FFD166]"  },
  { name: "Gym",            value: "gym-suggestion", bg: "bg-emerald-700", text: "text-emerald-400" },
  { name: "Récupération",   value: "recovery",       bg: "bg-[#A8FF78]",   text: "text-[#A8FF78]"  },
  { name: "Tâche",          value: "task",           bg: "bg-slate-700",   text: "text-slate-400"  },
  { name: "Repas",          value: "meal",           bg: "bg-rose-700",    text: "text-rose-400"   },
  { name: "Activité extra", value: "extra",          bg: "bg-[#FF6B9D]",   text: "text-[#FF6B9D]"  },
]

const APP_CATEGORIES = [
  "Cours", "Étude", "Fitness", "Gym", "Récupération", "Tâche", "Repas", "Activité extra",
]

const APP_TAGS = [
  "Cours magistral", "Travaux pratiques", "Travaux dirigés",
  "Étude", "Sport", "Récup", "Repas", "Personnel",
]

// Preferred time ranges: [startHour, startMin, endHour, endMin]
const PREFERRED_RANGES: Record<string, [number, number, number, number]> = {
  Matin:        [7,  0,  10, 0],
  Midi:         [11, 30, 13, 30],
  "Après-midi": [14, 0,  17, 0],
  Soir:         [18, 0,  21, 0],
}

// Sunday=0, Monday=1, ..., Saturday=6
const WEEK_DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekStartISO(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay())
  return d.toISOString().slice(0, 10)
}

function getWeekStartDate(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay())
  return d
}

function setupKey(userId: string, weekISO: string): string {
  return `agenda_setup_${userId}_${weekISO}`
}

function loadSetup(userId: string, weekISO: string): SetupState {
  try {
    const raw = localStorage.getItem(setupKey(userId, weekISO))
    if (!raw) return { step1: false, step2: false, step3: false }
    return JSON.parse(raw) as SetupState
  } catch {
    return { step1: false, step2: false, step3: false }
  }
}

function saveSetup(userId: string, weekISO: string, state: SetupState) {
  try {
    localStorage.setItem(setupKey(userId, weekISO), JSON.stringify(state))
  } catch {}
}

function getBannerVariant(includeGym: boolean, extraActivities: unknown): BannerVariant {
  if (includeGym) return "C"
  const arr = Array.isArray(extraActivities) ? extraActivities : []
  return arr.length > 0 ? "B" : "A"
}

// ── Gym placement algorithm ───────────────────────────────────────────────────

function findSlotInRange(
  date: Date,
  rangeStartH: number, rangeStartM: number,
  rangeEndH: number, rangeEndM: number,
  durationMin: number,
  existing: Event[],
): [Date, Date] | null {
  const slotStart = new Date(date)
  slotStart.setHours(rangeStartH, rangeStartM, 0, 0)
  const rangeEnd = new Date(date)
  rangeEnd.setHours(rangeEndH, rangeEndM, 0, 0)

  while (true) {
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000)
    if (slotEnd > rangeEnd) break
    const conflict = existing.some((e) => {
      if (e.startTime.toDateString() !== slotStart.toDateString()) return false
      return !(e.endTime <= slotStart || e.startTime >= slotEnd)
    })
    if (!conflict) return [new Date(slotStart), slotEnd]
    slotStart.setMinutes(slotStart.getMinutes() + 30)
  }
  return null
}

type GymGenerateResult = { suggestions: Event[]; shortfall: number }

function buildGymSuggestions(
  prefs: GymPreferences,
  existingEvents: Event[],
): GymGenerateResult {
  const suggestions: Event[] = []
  const weekStart = getWeekStartDate()

  const candidateDays = [1, 2, 3, 4, 5, 6, 0].filter(
    (i) => !prefs.daysToAvoid.includes(WEEK_DAY_LABELS[i])
  )

  for (const dayIndex of candidateDays) {
    if (suggestions.length >= prefs.sessionsPerWeek) break

    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + dayIndex)

    const allSoFar = [...existingEvents, ...suggestions]

    let slot: [Date, Date] | null = null

    for (const pref of prefs.preferredTimes) {
      const range = PREFERRED_RANGES[pref]
      if (!range) continue
      slot = findSlotInRange(date, range[0], range[1], range[2], range[3], prefs.sessionDuration, allSoFar)
      if (slot) break
    }

    if (!slot) {
      slot = findSlotInRange(date, 7, 0, 22, 0, prefs.sessionDuration, allSoFar)
    }

    if (slot) {
      suggestions.push({
        id: `gym-suggestion-${dayIndex}-${Date.now()}-${suggestions.length}`,
        title: "💪 Séance de gym",
        startTime: slot[0],
        endTime: slot[1],
        color: "gym-suggestion",
        category: "Gym",
        suggested: true,
      })
    }
  }

  return { suggestions, shortfall: prefs.sessionsPerWeek - suggestions.length }
}

// ── SetupBanner ───────────────────────────────────────────────────────────────

interface BannerProps {
  variant: "B" | "C"
  step1Done: boolean
  step2Done: boolean
  step3Done: boolean
  hasExtraActivities: boolean
}

function SetupBanner({ variant, step1Done, step2Done, step3Done, hasExtraActivities }: BannerProps) {
  const steps =
    variant === "B"
      ? [
          { label: "Ajoute tes cours",     done: step1Done, skip: false },
          { label: "Ajoute tes activités", done: step2Done, skip: false },
        ]
      : [
          { label: "Ajoute tes cours",     done: step1Done, skip: false },
          { label: "Ajoute tes activités", done: step2Done, skip: !hasExtraActivities },
          { label: "Planifie tes entraînements",   done: step3Done, skip: false },
        ]

  const activeIndex = steps.findIndex((s) => !s.done && !s.skip)

  let hint = ""
  if (activeIndex === 0)
    hint = "Commence par placer tes cours dans la grille →"
  else if (activeIndex === 1)
    hint = "Tes cours sont placés. Ajoute tes activités récurrentes →"
  else if (activeIndex === 2 || (activeIndex === -1 && variant === "C" && !step3Done))
    hint = "Tout est en place. Lance la génération de tes séances de gym ↓"

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 flex flex-col gap-1 max-h-16 justify-center">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isDone = step.done || step.skip
          const isActive = i === activeIndex
          const isLocked = !isDone && !isActive

          return (
            <div key={i} className="flex items-center gap-0 flex-1 min-w-0">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-space-grotesk font-semibold whitespace-nowrap transition-all",
                  isDone  && "bg-[#9B8FFF]/20 text-[#9B8FFF]",
                  isActive && "bg-transparent border border-[#9B8FFF] text-[#9B8FFF]",
                  isLocked && "bg-transparent text-text-muted",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                ) : isLocked ? (
                  <Lock className="h-2.5 w-2.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 flex-shrink-0" />
                )}
                <span>
                  {i + 1}.{" "}
                  {step.skip
                    ? <s className="opacity-50">{step.label}</s>
                    : step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-1 transition-colors",
                    isDone ? "bg-[#9B8FFF]/40" : "bg-border-subtle",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {hint && (
        <p className="font-space-grotesk text-[11px] text-text-muted truncate">{hint}</p>
      )}
    </div>
  )
}

// ── EmptyStateOverlay ─────────────────────────────────────────────────────────

function EmptyStateOverlay({ onAddCours }: { onAddCours: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-base/60 backdrop-blur-[2px] rounded-xl pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface px-8 py-7 shadow-xl max-w-xs text-center">
        <svg
          className="h-10 w-10 text-text-muted"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <div>
          <p className="font-syne text-[15px] font-semibold text-text-primary">
            Ta semaine est vide pour l&apos;instant.
          </p>
          <p className="mt-1 font-space-grotesk text-[12px] text-text-muted leading-relaxed">
            Commence par ajouter tes cours via le bouton&nbsp;+ ou en cliquant sur un créneau.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddCours}
          className="mt-1 px-4 py-2 rounded-lg bg-[#9B8FFF] text-white font-space-grotesk text-[13px] font-semibold hover:bg-[#8A7FEE] transition-colors cursor-pointer"
        >
          + Ajouter un cours
        </button>
      </div>
    </div>
  )
}

// ── InlineToast ───────────────────────────────────────────────────────────────

function InlineToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 font-space-grotesk text-[13px] text-[#FF6B6B]">
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer">
        ✕
      </button>
    </div>
  )
}

// ── AgendaClient ──────────────────────────────────────────────────────────────

export function AgendaClient({
  userId,
  initialEvents,
  includeGym,
  gymPreferences,
  extraActivities,
}: AgendaClientProps) {
  const weekISO = useMemo(() => getWeekStartISO(), [])

  const baseEvents: Event[] = useMemo(
    () => initialEvents.map((e) => ({ ...e, startTime: new Date(e.startTime), endTime: new Date(e.endTime) })),
    // stable across renders — only used as initial value
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const prefs = useMemo(
    () =>
      includeGym &&
      gymPreferences &&
      typeof (gymPreferences as GymPreferences).sessionsPerWeek === "number"
        ? (gymPreferences as GymPreferences)
        : null,
    [includeGym, gymPreferences],
  )

  const hasExtraActivities = Array.isArray(extraActivities) && (extraActivities as unknown[]).length > 0

  const bannerVariant = useMemo(
    () => getBannerVariant(includeGym, extraActivities),
    [includeGym, extraActivities],
  )

  // Mirror of EventManager's events used only for step-completion detection
  const [mirrorEvents, setMirrorEvents] = useState<Event[]>(baseEvents)

  // Pending gym suggestion IDs (suggestions still in the grid, not yet confirmed)
  const [pendingSuggestionIds, setPendingSuggestionIds] = useState<Set<string>>(new Set())
  // Current position of each pending suggestion (user may have dragged it)
  const pendingMovedRef = useRef<Map<string, Event>>(new Map())

  // localStorage setup state — initialised after mount to avoid SSR hydration mismatch
  const [setupState, setSetupState] = useState<SetupState>({ step1: false, step2: false, step3: false })
  useEffect(() => {
    setSetupState(loadSetup(userId, weekISO))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const dismissToast = useCallback(() => setToastMsg(null), [])

  const emRef = useRef<EventManagerHandle>(null)

  // ── Step completion ─────────────────────────────────────────────────────────

  const step1Live = useMemo(
    () => mirrorEvents.some((e) => e.category === "Cours"),
    [mirrorEvents],
  )

  const step2Live = useMemo(() => {
    if (!hasExtraActivities) return true
    return mirrorEvents.some((e) => e.category === "Activité extra")
  }, [mirrorEvents, hasExtraActivities])

  const [step3Confirmed, setStep3Confirmed] = useState(false)

  const step1Done = step1Live || setupState.step1
  const step2Done = step2Live || setupState.step2
  const step3Done = step3Confirmed || setupState.step3

  // Persist newly completed steps to localStorage
  useEffect(() => {
    if (step1Live && !setupState.step1) {
      const next = { ...setupState, step1: true }
      setSetupState(next)
      saveSetup(userId, weekISO, next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1Live])

  useEffect(() => {
    if (step2Live && !setupState.step2) {
      const next = { ...setupState, step2: true }
      setSetupState(next)
      saveSetup(userId, weekISO, next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step2Live])

  useEffect(() => {
    if (step3Confirmed && !setupState.step3) {
      const next = { ...setupState, step3: true }
      setSetupState(next)
      saveSetup(userId, weekISO, next)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3Confirmed])

  // ── Banner visibility ───────────────────────────────────────────────────────

  const showBanner = useMemo(() => {
    if (bannerVariant === "A") return false
    if (bannerVariant === "B") return !(step1Done && step2Done)
    return !(step1Done && step2Done && step3Done)
  }, [bannerVariant, step1Done, step2Done, step3Done])

  // ── Empty state ─────────────────────────────────────────────────────────────

  // Count non-gym-suggestion events
  const nonGymEventCount = useMemo(
    () => mirrorEvents.filter((e) => !pendingSuggestionIds.has(e.id)).length,
    [mirrorEvents, pendingSuggestionIds],
  )
  const isEmpty = nonGymEventCount === 0

  // ── EventManager callbacks ──────────────────────────────────────────────────

  const handleEventCreate = useCallback((event: Omit<Event, "id">) => {
    const full = event as Event
    setMirrorEvents((prev) => [...prev, full])
  }, [])

  const handleEventUpdate = useCallback((id: string, partial: Partial<Event>) => {
    setMirrorEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)))
    if (pendingMovedRef.current.has(id)) {
      const existing = pendingMovedRef.current.get(id)!
      pendingMovedRef.current.set(id, { ...existing, ...partial })
    }
  }, [])

  const handleEventDelete = useCallback((id: string) => {
    setMirrorEvents((prev) => prev.filter((e) => e.id !== id))
    if (pendingSuggestionIds.has(id)) {
      setPendingSuggestionIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      pendingMovedRef.current.delete(id)
    }
  }, [pendingSuggestionIds])

  // ── Gym generation ──────────────────────────────────────────────────────────

  const handleGenerateGym = useCallback(() => {
    if (!prefs) return

    // Remove previous suggestions if any
    if (pendingSuggestionIds.size > 0) {
      emRef.current?.removeEvents(Array.from(pendingSuggestionIds))
      setPendingSuggestionIds(new Set())
      pendingMovedRef.current.clear()
    }

    const { suggestions, shortfall } = buildGymSuggestions(prefs, mirrorEvents)

    emRef.current?.addEvents(suggestions)
    const newIds = new Set(suggestions.map((s) => s.id))
    setPendingSuggestionIds(newIds)
    pendingMovedRef.current = new Map(suggestions.map((s) => [s.id, s]))

    if (shortfall > 0) {
      setToastMsg(
        "Impossible de placer toutes les séances. Essaie de déplacer certains blocs."
      )
    }
  }, [prefs, mirrorEvents, pendingSuggestionIds])

  // ── Gym confirmation ────────────────────────────────────────────────────────

  const handleConfirmGym = useCallback(async () => {
    const toConfirm = Array.from(pendingMovedRef.current.values()).filter((s) =>
      pendingSuggestionIds.has(s.id)
    )

    if (toConfirm.length > 0) {
      try {
        const res = await fetch("/api/agenda/gym-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            toConfirm.map((s) => ({
              startTime: s.startTime.toISOString(),
              endTime: s.endTime.toISOString(),
            }))
          ),
        })
        if (!res.ok) throw new Error("api error")
      } catch {
        setToastMsg("Erreur lors de la confirmation. Réessaie.")
        return
      }
    }

    emRef.current?.confirmEvents(Array.from(pendingSuggestionIds))
    setPendingSuggestionIds(new Set())
    pendingMovedRef.current.clear()
    setStep3Confirmed(true)
  }, [pendingSuggestionIds])

  const handleCancelGym = useCallback(() => {
    emRef.current?.removeEvents(Array.from(pendingSuggestionIds))
    setPendingSuggestionIds(new Set())
    pendingMovedRef.current.clear()
  }, [pendingSuggestionIds])

  const hasPendingSuggestions = pendingSuggestionIds.size > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Setup progress banner */}
      {showBanner && bannerVariant !== "A" && (
        <SetupBanner
          variant={bannerVariant as "B" | "C"}
          step1Done={step1Done}
          step2Done={step2Done}
          step3Done={step3Done}
          hasExtraActivities={hasExtraActivities}
        />
      )}

      {/* Toast notification */}
      {toastMsg && <InlineToast message={toastMsg} onDismiss={dismissToast} />}

      {/* Gym generate button (Variant C only) */}
      {includeGym && (
        <div className="flex items-center justify-end">
          <div className="relative group">
            <button
              type="button"
              disabled={!step1Done}
              onClick={handleGenerateGym}
              className={cn(
                "px-4 py-2 rounded-lg font-space-grotesk text-[13px] font-semibold transition-colors",
                step1Done
                  ? "bg-[#4ade80] text-[#0A0A14] hover:bg-[#3bcf70] cursor-pointer"
                  : "bg-bg-elevated text-text-muted cursor-not-allowed opacity-60",
              )}
            >
              Planifier mes entraînements
            </button>
            {!step1Done && (
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-bg-elevated border border-border-subtle px-3 py-2 text-[11px] font-space-grotesk text-text-muted opacity-0 group-hover:opacity-100 transition-opacity text-center shadow-lg z-50">
                Ajoute d&apos;abord tes cours pour optimiser le placement.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Gym suggestion confirmation bar */}
      {hasPendingSuggestions && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl flex-wrap">
          <div>
            <p className="font-space-grotesk text-[13px] text-[#4ade80] font-semibold">
              {pendingSuggestionIds.size} séance{pendingSuggestionIds.size > 1 ? "s" : ""} suggérée{pendingSuggestionIds.size > 1 ? "s" : ""} cette semaine
            </p>
            <p className="font-space-grotesk text-[12px] text-text-muted mt-0.5">
              Glisse-les pour les repositionner, puis confirme pour les valider.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleCancelGym}
              className="px-3 py-2 rounded-lg border border-border-subtle text-text-muted font-space-grotesk text-[13px] hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
            >
              Tout annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmGym}
              className="px-4 py-2 bg-[#4ade80] text-[#0A0A14] rounded-lg font-space-grotesk text-[13px] font-semibold hover:bg-[#3bcf70] transition-colors cursor-pointer"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="relative">
        {isEmpty && (
          <EmptyStateOverlay
            onAddCours={() => emRef.current?.openCreate({ category: "Cours" })}
          />
        )}
        <EventManager
          ref={emRef}
          events={baseEvents}
          colors={APP_COLORS}
          categories={APP_CATEGORIES}
          defaultView="week"
          availableTags={APP_TAGS}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      </div>
    </div>
  )
}
