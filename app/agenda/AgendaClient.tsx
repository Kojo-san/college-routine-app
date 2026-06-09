"use client"

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

const APP_COLORS = [
  { name: "Cours",         value: "cours",    bg: "bg-[#9B8FFF]", text: "text-[#9B8FFF]" },
  { name: "Étude",         value: "study",    bg: "bg-[#4A9EFF]", text: "text-[#4A9EFF]" },
  { name: "Fitness",       value: "fitness",  bg: "bg-[#FFD166]", text: "text-[#FFD166]" },
  { name: "Récupération",  value: "recovery", bg: "bg-[#A8FF78]", text: "text-[#A8FF78]" },
  { name: "Tâche",         value: "task",     bg: "bg-[#8888AA]", text: "text-[#8888AA]" },
  { name: "Repas",         value: "meal",     bg: "bg-[#FF9966]", text: "text-[#FF9966]" },
]

const APP_CATEGORIES = ["Cours", "Étude", "Fitness", "Récupération", "Tâche", "Repas"]

const APP_TAGS = ["CM", "TP", "Étude", "Sport", "Récup", "Repas", "Personnel"]

interface AgendaClientProps {
  initialEvents: SerializedEvent[]
}

export function AgendaClient({ initialEvents }: AgendaClientProps) {
  const events: Event[] = initialEvents.map((e) => ({
    ...e,
    startTime: new Date(e.startTime),
    endTime:   new Date(e.endTime),
  }))

  return (
    <EventManager
      events={events}
      colors={APP_COLORS}
      categories={APP_CATEGORIES}
      defaultView="week"
      availableTags={APP_TAGS}
    />
  )
}
