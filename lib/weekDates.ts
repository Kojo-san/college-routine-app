// Pure date helpers shared between server and client agenda code.
//
// The client (browser) always uses *local* calendar arithmetic — this is
// the authoritative source of "what week is this" since it knows the
// user's real timezone. `.toISOString()` on a local-midnight Date still
// yields the precise UTC instant, so the API's [weekStart, weekStart+7d)
// window stays exact with no skew.
//
// The server has no browser timezone to work with at render time, so it
// only produces a best-effort UTC-anchored guess for the very first paint;
// the client self-corrects on mount against its own local week.

export function getMondayLocal(date: Date): Date {
  const day = date.getDay() // 0=Dim … 6=Sam
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() + diff)
  return monday
}

export function addDaysLocal(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function getMondayUTC(date: Date): Date {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() + diff)
  return monday
}

export const WEEKDAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function formatWeekRangeLabel(monday: Date): string {
  const sunday = addDaysLocal(monday, 6)
  const fmt = (d: Date, withMonth: boolean) =>
    withMonth
      ? d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
      : d.toLocaleDateString('fr-CA', { day: 'numeric' })

  const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear()
  const start = sameMonth ? fmt(monday, false) : fmt(monday, true)
  const end = fmt(sunday, true)
  return `${start} – ${end}`
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
