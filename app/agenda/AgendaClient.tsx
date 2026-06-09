"use client"

import { useState, useRef } from "react"
import { EventManager, type Event } from "@/components/ui/event-manager"

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

const APP_COLORS = [
  { name: "Cours",        value: "cours",          bg: "bg-[#9B8FFF]", text: "text-[#9B8FFF]" },
  { name: "Étude",        value: "study",          bg: "bg-[#4A9EFF]", text: "text-[#4A9EFF]" },
  { name: "Fitness",      value: "fitness",        bg: "bg-[#FFD166]", text: "text-[#FFD166]" },
  { name: "Gym",          value: "gym-suggestion", bg: "bg-[#4ade80]", text: "text-[#4ade80]" },
  { name: "Récupération", value: "recovery",       bg: "bg-[#A8FF78]", text: "text-[#A8FF78]" },
  { name: "Tâche",        value: "task",           bg: "bg-[#8888AA]", text: "text-[#8888AA]" },
  { name: "Repas",        value: "meal",           bg: "bg-[#FF9966]", text: "text-[#FF9966]" },
]

const APP_CATEGORIES = ["Cours", "Étude", "Fitness", "Gym", "Récupération", "Tâche", "Repas"]

const APP_TAGS = [
  "Cours magistral",
  "Travaux pratiques",
  "Travaux dirigés",
  "Étude",
  "Sport",
  "Récup",
  "Repas",
  "Personnel",
]

const PREFERRED_TIME_HOURS: Record<string, number> = {
  Matin: 7,
  Midi: 12,
  "Après-midi": 14,
  Soir: 18,
}

// Sunday=0, Monday=1, ..., Saturday=6
const WEEK_DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

function generateGymSuggestions(prefs: GymPreferences, existingEvents: Event[]): Event[] {
  const suggestions: Event[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Sunday of current week

  const preferredHour =
    prefs.preferredTimes.length > 0
      ? (PREFERRED_TIME_HOURS[prefs.preferredTimes[0]] ?? 7)
      : 7

  // Prefer Mon–Fri, then weekend; skip avoided days
  const candidateDayIndices = [1, 2, 3, 4, 5, 6, 0].filter(
    (i) => !prefs.daysToAvoid.includes(WEEK_DAY_LABELS[i])
  )

  for (const dayIndex of candidateDayIndices) {
    if (suggestions.length >= prefs.sessionsPerWeek) break

    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + dayIndex)

    const startTime = new Date(date)
    startTime.setHours(preferredHour, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + prefs.sessionDuration)

    const hasConflict = existingEvents.some((e) => {
      if (e.startTime.toDateString() !== startTime.toDateString()) return false
      return !(e.endTime <= startTime || e.startTime >= endTime)
    })

    if (!hasConflict) {
      suggestions.push({
        id: `gym-suggestion-${dayIndex}-${Date.now()}-${suggestions.length}`,
        title: "💪 Séance de gym",
        startTime,
        endTime,
        color: "gym-suggestion",
        category: "Gym",
        suggested: true,
      })
    }
  }

  return suggestions
}

interface AgendaClientProps {
  initialEvents: SerializedEvent[]
  includeGym?: boolean
  gymPreferences?: unknown
}

export function AgendaClient({ initialEvents, includeGym, gymPreferences }: AgendaClientProps) {
  const baseEvents: Event[] = initialEvents.map((e) => ({
    ...e,
    startTime: new Date(e.startTime),
    endTime: new Date(e.endTime),
  }))

  // Compute gym suggestions once on mount
  const gymSuggestions = useState<Event[]>(() => {
    if (!includeGym || !gymPreferences) return []
    const prefs = gymPreferences as GymPreferences
    if (typeof prefs?.sessionsPerWeek !== "number") return []
    return generateGymSuggestions(prefs, baseEvents)
  })[0]

  const [pendingSuggestionIds, setPendingSuggestionIds] = useState<Set<string>>(
    () => new Set(gymSuggestions.map((s) => s.id))
  )

  // Track current positions of pending suggestions (user may drag them)
  const pendingMovedRef = useRef<Map<string, Event>>(
    new Map(gymSuggestions.map((s) => [s.id, s]))
  )

  const hasPendingSuggestions = pendingSuggestionIds.size > 0

  function handleEventDelete(id: string) {
    if (pendingSuggestionIds.has(id)) {
      setPendingSuggestionIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      pendingMovedRef.current.delete(id)
    }
  }

  function handleEventUpdate(id: string, partial: Partial<Event>) {
    if (pendingMovedRef.current.has(id)) {
      const existing = pendingMovedRef.current.get(id)!
      pendingMovedRef.current.set(id, { ...existing, ...partial })
    }
  }

  function handleConfirm() {
    // In a full implementation: POST confirmed sessions to DB here
    setPendingSuggestionIds(new Set())
  }

  const allEvents = [...baseEvents, ...gymSuggestions]

  return (
    <div className="flex flex-col gap-4">
      {hasPendingSuggestions && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl flex-wrap">
          <div>
            <p className="font-space-grotesk text-[13px] text-[#4ade80] font-semibold">
              {pendingSuggestionIds.size} séance
              {pendingSuggestionIds.size > 1 ? "s" : ""} de gym suggérée
              {pendingSuggestionIds.size > 1 ? "s" : ""} cette semaine
            </p>
            <p className="font-space-grotesk text-[12px] text-text-muted mt-0.5">
              Glisse-les pour les repositionner, puis confirme pour les valider.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#4ade80] text-[#0A0A14] rounded-lg font-space-grotesk text-[13px] font-semibold hover:bg-[#3bcf70] transition-colors flex-shrink-0 cursor-pointer"
          >
            Confirmer les séances
          </button>
        </div>
      )}

      <EventManager
        events={allEvents}
        colors={APP_COLORS}
        categories={APP_CATEGORIES}
        defaultView="week"
        availableTags={APP_TAGS}
        onEventDelete={handleEventDelete}
        onEventUpdate={handleEventUpdate}
      />
    </div>
  )
}
