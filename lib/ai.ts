import Anthropic from '@anthropic-ai/sdk'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeedRule {
  id: string
  name: string
  condition: string
  recommendationTemplate: string
  evidenceTitle: string
  evidenceAuthors: string
  evidenceYear: number
  evidenceSummary: string | null
}

export interface AIRecommendationContext {
  ruleName: string
  sleepDebt?: number
  focusLevel?: number
  physicalFatigue?: number
  stressLevel?: number
  recoveryValue?: number
  motivationLevel?: number
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function buildSystemPrompt(rules: SeedRule[]): string {
  const rulesBlock = rules
    .map(r => {
      const summary = r.evidenceSummary ? `\n     Résumé : ${r.evidenceSummary}` : ''
      return `- Règle "${r.name}" (condition : ${r.condition})
     Source : ${r.evidenceAuthors} (${r.evidenceYear}) — "${r.evidenceTitle}"${summary}`
    })
    .join('\n\n')

  return `Tu es le moteur de recommandations de College Routine, une plateforme de performance académique pour étudiants universitaires.

Ton rôle : générer des explications personnalisées, courtes et factuelles pour les recommandations de santé et de performance.

Règles actives du système :

${rulesBlock}

Directives de génération :
- 1 à 2 phrases maximum, directes et actionnables
- Cite toujours la valeur numérique du Signal concerné
- Mentionne brièvement le mécanisme physiologique ou cognitif en jeu
- Ton confiant et factuel, jamais condescendant
- Pas de point d'exclamation, pas d'emojis
- Ne commence pas par "Je" — formule une recommandation, pas une réponse`
}

export function buildStudentContextBlock(ctx: AIRecommendationContext): string {
  const lines: string[] = []
  if (ctx.sleepDebt !== undefined)      lines.push(`Dette de sommeil : ${ctx.sleepDebt.toFixed(1)}h`)
  if (ctx.focusLevel !== undefined)     lines.push(`Focus : ${ctx.focusLevel}/100`)
  if (ctx.physicalFatigue !== undefined) lines.push(`Fatigue physique : ${ctx.physicalFatigue}%`)
  if (ctx.stressLevel !== undefined)    lines.push(`Stress : ${ctx.stressLevel}%`)
  if (ctx.recoveryValue !== undefined)  lines.push(`Score récupération : ${ctx.recoveryValue}/100`)
  if (ctx.motivationLevel !== undefined) lines.push(`Motivation : ${ctx.motivationLevel}/100`)
  return lines.join('\n')
}

export function buildUserPrompt(rule: SeedRule, ctx: AIRecommendationContext): string {
  const contextBlock = buildStudentContextBlock(ctx)
  const contextSection = contextBlock
    ? `Données actuelles de l'étudiant :\n${contextBlock}\n\n`
    : ''

  return `Génère la recommandation pour la règle "${rule.name}".

${contextSection}Template de base : "${rule.recommendationTemplate}"

Génère une explication personnalisée en 1-2 phrases qui cite les valeurs numériques et explique le mécanisme en jeu.`
}

export function interpolateTemplate(
  template: string,
  ctx: AIRecommendationContext,
): string {
  let result = template
  if (ctx.sleepDebt !== undefined)       result = result.replace('{sleepDebt}',      ctx.sleepDebt.toFixed(1))
  if (ctx.focusLevel !== undefined)      result = result.replace('{focusLevel}',     String(ctx.focusLevel))
  if (ctx.physicalFatigue !== undefined) result = result.replace('{physicalFatigue}', String(ctx.physicalFatigue))
  if (ctx.stressLevel !== undefined)     result = result.replace('{stressLevel}',    String(ctx.stressLevel))
  if (ctx.recoveryValue !== undefined)   result = result.replace('{recoveryValue}',  String(ctx.recoveryValue))
  if (ctx.motivationLevel !== undefined) result = result.replace('{motivationLevel}', String(ctx.motivationLevel))
  return result
}

export function extractMessageText(content: { type: string; text?: string }[]): string {
  return content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
}

// ─── Claude API call ──────────────────────────────────────────────────────────

let _client: Anthropic | null = null

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (!_client) _client = new Anthropic({ apiKey })
  return _client
}

export async function enrichRecommendationMessage(
  rule: SeedRule,
  context: AIRecommendationContext,
): Promise<string> {
  const fallback = interpolateTemplate(rule.recommendationTemplate, context)

  const client = getClient()
  if (!client) return fallback

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt([rule]),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(rule, context),
        },
      ],
    })

    return extractMessageText(response.content) || fallback
  } catch {
    return fallback
  }
}
