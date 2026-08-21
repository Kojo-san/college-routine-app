import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString = (process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL)!
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

// ─── Target user ────────────────────────────────────────────────────────────
// Semester: Automne 2026. September 1, 2026 is a Tuesday (the spec's "Monday
// Sept 1" was off by one — dates below use the real calendar; each event's
// weekday label matches its actual course day).

const USER_EMAIL = 'iszrytheg@gmail.com'
const UNTIL = 'UNTIL=20261219T235959Z'

// Montreal is UTC-4 (EDT) in September — all times below are pre-converted
// to UTC (local hour + 4).

interface EventSeed {
  title: string
  type: 'COURS' | 'LAB'
  color: string
  location?: string
  // First occurrence, already in UTC
  start: Date
  end: Date
  rrule: string
}

const events: EventSeed[] = [
  {
    title: 'INF3710 — Fichiers et BD (Lab)',
    type: 'LAB',
    color: '#4E2A84',
    // Monday 08:30–11:30 local → first Monday on/after 2026-09-01 = 2026-09-07
    start: new Date(Date.UTC(2026, 8, 7, 12, 30)),
    end: new Date(Date.UTC(2026, 8, 7, 15, 30)),
    rrule: `FREQ=WEEKLY;BYDAY=MO;${UNTIL}`,
  },
  {
    title: 'INF3710 — Fichiers et BD (Cours)',
    type: 'COURS',
    color: '#4E2A84',
    // Friday 14:45–17:45 local → first Friday on/after 2026-09-01 = 2026-09-04
    start: new Date(Date.UTC(2026, 8, 4, 18, 45)),
    end: new Date(Date.UTC(2026, 8, 4, 21, 45)),
    rrule: `FREQ=WEEKLY;BYDAY=FR;${UNTIL}`,
  },
  {
    title: 'LOG3000 — Processus du GL (Lab)',
    type: 'LAB',
    color: '#C9006B',
    // Wednesday 08:30–11:30 local → first Wednesday on/after 2026-09-01 = 2026-09-02
    start: new Date(Date.UTC(2026, 8, 2, 12, 30)),
    end: new Date(Date.UTC(2026, 8, 2, 15, 30)),
    rrule: `FREQ=WEEKLY;BYDAY=WE;${UNTIL}`,
  },
  {
    title: 'LOG3000 — Processus du GL (Cours)',
    type: 'COURS',
    color: '#C9006B',
    // Wednesday 12:45–14:45 local → 2026-09-02
    start: new Date(Date.UTC(2026, 8, 2, 16, 45)),
    end: new Date(Date.UTC(2026, 8, 2, 18, 45)),
    rrule: `FREQ=WEEKLY;BYDAY=WE;${UNTIL}`,
  },
  {
    title: 'LOG3005 — Communication écrite et orale',
    type: 'COURS',
    color: '#7C3AED',
    // Wednesday 17:45–18:45 local → 2026-09-02
    start: new Date(Date.UTC(2026, 8, 2, 21, 45)),
    end: new Date(Date.UTC(2026, 8, 2, 22, 45)),
    rrule: `FREQ=WEEKLY;BYDAY=WE;${UNTIL}`,
  },
  {
    title: 'LOG3430 — Méthodes de test (Lab)',
    type: 'LAB',
    color: '#FF7043',
    // Thursday 08:30–11:30 local → first Thursday on/after 2026-09-01 = 2026-09-03
    start: new Date(Date.UTC(2026, 8, 3, 12, 30)),
    end: new Date(Date.UTC(2026, 8, 3, 15, 30)),
    rrule: `FREQ=WEEKLY;BYDAY=TH;${UNTIL}`,
  },
  {
    title: 'LOG3430 — Méthodes de test (Cours, en ligne)',
    type: 'COURS',
    color: '#FF7043',
    location: 'À distance',
    // Thursday 19:00–21:00 local → 2026-09-03 (crosses midnight UTC)
    start: new Date(Date.UTC(2026, 8, 3, 23, 0)),
    end: new Date(Date.UTC(2026, 8, 4, 1, 0)),
    rrule: `FREQ=WEEKLY;BYDAY=TH;${UNTIL}`,
  },
  {
    title: 'LOG3900 — Projet évol. logiciel (Cours)',
    type: 'COURS',
    color: '#0891B2',
    // Tuesday 08:30–12:30 local → first Tuesday on/after 2026-09-01 = 2026-09-01
    start: new Date(Date.UTC(2026, 8, 1, 12, 30)),
    end: new Date(Date.UTC(2026, 8, 1, 16, 30)),
    rrule: `FREQ=WEEKLY;BYDAY=TU;${UNTIL}`,
  },
  {
    title: 'LOG3900 — Projet évol. logiciel (Lab hebdo)',
    type: 'LAB',
    color: '#0891B2',
    // Tuesday 10:30–17:45 local → 2026-09-01
    start: new Date(Date.UTC(2026, 8, 1, 14, 30)),
    end: new Date(Date.UTC(2026, 8, 1, 21, 45)),
    rrule: `FREQ=WEEKLY;BYDAY=TU;${UNTIL}`,
  },
]

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL }, select: { id: true, name: true } })
  if (!user) throw new Error(`User ${USER_EMAIL} not found`)

  console.log(`Seeding events for ${user.name} (${USER_EMAIL})...`)

  for (const e of events) {
    const created = await prisma.event.create({
      data: {
        userId: user.id,
        title: e.title,
        startTime: e.start,
        endTime: e.end,
        type: e.type,
        color: e.color,
        location: e.location,
        rrule: e.rrule,
      },
    })
    console.log(`  ✓ ${created.title} — ${created.startTime.toISOString()}`)
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
