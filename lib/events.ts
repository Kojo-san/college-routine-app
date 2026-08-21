import { RRule } from 'rrule'
import prisma from './prisma'
import type { EventType } from '@/app/generated/prisma/client'

export interface EventOccurrence {
  id: string
  title: string
  startTime: string
  endTime: string
  type: EventType
  color: string
  location: string | null
  isRecurring: boolean
  eventId: string
  rrule: string | null
}

interface EventRow {
  id: string
  title: string
  startTime: Date
  endTime: Date
  type: EventType
  color: string
  location: string | null
  rrule: string | null
}

export function expandOccurrences(
  event: EventRow,
  weekStart: Date,
  weekEnd: Date,
): EventOccurrence[] {
  const durationMs = event.endTime.getTime() - event.startTime.getTime()

  if (!event.rrule) {
    if (event.startTime >= weekStart && event.startTime < weekEnd) {
      return [{
        id: event.id,
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        type: event.type,
        color: event.color,
        location: event.location,
        isRecurring: false,
        eventId: event.id,
        rrule: event.rrule,
      }]
    }
    return []
  }

  const options = RRule.parseString(event.rrule)
  options.dtstart = event.startTime
  const rule = new RRule(options)

  const occurrences = rule.between(weekStart, weekEnd, true)

  return occurrences.map((occStart) => {
    const occEnd = new Date(occStart.getTime() + durationMs)
    return {
      id: `${event.id}::${occStart.toISOString()}`,
      title: event.title,
      startTime: occStart.toISOString(),
      endTime: occEnd.toISOString(),
      type: event.type,
      color: event.color,
      location: event.location,
      isRecurring: true,
      eventId: event.id,
      rrule: event.rrule,
    }
  })
}

export async function getWeekEvents(userId: string, weekStart: Date): Promise<EventOccurrence[]> {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const events = await prisma.event.findMany({ where: { userId } })
  const occurrences = events.flatMap((e) => expandOccurrences(e, weekStart, weekEnd))
  occurrences.sort((a, b) => a.startTime.localeCompare(b.startTime))
  return occurrences
}

export async function hasAnyEvents(userId: string): Promise<boolean> {
  const count = await prisma.event.count({ where: { userId } })
  return count > 0
}
