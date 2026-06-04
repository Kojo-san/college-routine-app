export function parseApiError(body: unknown, status: number): string {
  if (body !== null && body !== undefined && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.error === 'string') return b.error
  }

  if (status === 404) return 'Aucun étudiant trouvé dans la base de données.'
  if (status === 503) return 'Service IA indisponible — vérifiez la clé ANTHROPIC_API_KEY dans .env.'
  if (status >= 500) return `Erreur serveur (${status}) — vérifiez les logs Next.js.`
  return `Erreur ${status}`
}
