import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString = (process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL)!
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })

// ─── Evidence Sources ─────────────────────────────────────────────────────────

const evidenceSources = [
  {
    id: 'es-tricou-2024',
    title: "La Science du sommeil et de l'éveil — 12 outils simples du quotidien",
    authors: 'Léo-Paul Tricou',
    year: 2024,
    summary:
      "Atelier pratique du Service aux Étudiants de Polytechnique Montréal. Revue de 40+ études sur la lumière, la température, l'alimentation et les comportements liés au sommeil et à l'éveil.",
  },
  {
    id: 'es-hassanbeigi-2011',
    title:
      'The relationship between study skills and academic performance of university students',
    authors: 'Hassanbeigi et al.',
    year: 2011,
    summary:
      "Étude de 179 étudiants en médecine (Yazd, Iran). Les scores en gestion du temps, concentration-mémoire, prise de notes et organisation prédisent significativement le GPA (p<0.01 pour les 7 dimensions mesurées).",
  },
  {
    id: 'es-sep-poly-2025',
    title: "Réussir à Poly — Méthodes d'études efficaces",
    authors: 'Service aux Étudiants, Polytechnique Montréal',
    year: 2025,
    summary:
      "Atelier pratique sur la matrice d'Eisenhower, la technique Pomodoro (50+10 min), les stratégies contre la procrastination et la planification trimestrielle/hebdomadaire/quotidienne.",
  },
] as const

// ─── Scientific Rules ─────────────────────────────────────────────────────────

const scientificRules = [
  {
    id: 'sr-sleep-debt',
    name: 'SLEEP_DEBT_RULE',
    condition: 'sleepDebt > 1h',
    recommendationTemplate:
      "Tu as accumulé {sleepDebt}h de dette de sommeil. Ce soir, priorise une nuit de 7h30 pour restaurer tes réserves de dopamine et retrouver ton niveau de focus habituel.",
    evidenceSourceId: 'es-tricou-2024',
  },
  {
    id: 'sr-low-focus',
    name: 'LOW_FOCUS_RULE',
    condition: 'focusLevel < 40',
    recommendationTemplate:
      "Ton focus est à {focusLevel}/100 aujourd'hui. Réduis tes Séances d'Étude à 25 min avec pauses obligatoires de 10 min — la surcharge cognitive aggrave la procrastination.",
    evidenceSourceId: 'es-hassanbeigi-2011',
  },
  {
    id: 'sr-high-fatigue',
    name: 'HIGH_FATIGUE_RULE',
    condition: 'physicalFatigue > 60',
    recommendationTemplate:
      "Ta fatigue physique est à {physicalFatigue}%. Remplace la Séance Fitness par 20 min de récupération active — marche légère ou étirements — pour protéger la qualité de ton sommeil ce soir.",
    evidenceSourceId: 'es-tricou-2024',
  },
  {
    id: 'sr-high-stress',
    name: 'HIGH_STRESS_RULE',
    condition: 'stressLevel > 70',
    recommendationTemplate:
      "Ton stress atteint {stressLevel}%. Intègre une pause de 20 min en milieu de journée — cohérence cardiaque ou NSDR — pour réduire le cortisol et améliorer la qualité de l'apprentissage profond.",
    evidenceSourceId: 'es-sep-poly-2025',
  },
] as const

// ─── Demo user ────────────────────────────────────────────────────────────────

const demoUser = {
  id: 'user-demo',
  name: 'Gamaliel',
  email: 'demo@college-routine.app',
}

const demoPrefs = {
  preferredWakeTime: '07:00',
  preferredSleepTime: '23:00',
  preferredGymTime: '17:30',
  maxDailyStudyHours: 6,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding demo user...')
  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    create: demoUser,
    update: { name: demoUser.name },
  })
  await prisma.planningPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...demoPrefs },
    update: demoPrefs,
  })
  console.log(`  ✓ ${user.id} (${user.name})`)

  console.log('Seeding EvidenceSources...')
  for (const src of evidenceSources) {
    await prisma.evidenceSource.upsert({
      where: { id: src.id },
      create: src,
      update: { title: src.title, authors: src.authors, year: src.year, summary: src.summary },
    })
    console.log(`  ✓ ${src.id}`)
  }

  console.log('Seeding ScientificRules...')
  for (const rule of scientificRules) {
    await prisma.scientificRule.upsert({
      where: { id: rule.id },
      create: rule,
      update: {
        name: rule.name,
        condition: rule.condition,
        recommendationTemplate: rule.recommendationTemplate,
        evidenceSourceId: rule.evidenceSourceId,
      },
    })
    console.log(`  ✓ ${rule.id}`)
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
