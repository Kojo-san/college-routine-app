function readApiKey(): string | null {
  const raw = process.env.RAPIDAPI_KEY ?? ''
  // dotenv may leave leading spaces or surrounding quotes depending on format
  const cleaned = raw.trim().replace(/^["']|["']$/g, '')
  return cleaned || null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exerciseDbId: string }> },
) {
  const { exerciseDbId } = await params

  const apiKey = readApiKey()
  console.log('RAPIDAPI_KEY present:', !!apiKey)

  if (!apiKey) {
    return Response.json({ gifUrl: null })
  }

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/exercise/${encodeURIComponent(exerciseDbId)}`
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      console.error(`ExerciseDB gif error: ${res.status} ${res.statusText} for id=${exerciseDbId}`)
      return Response.json({ gifUrl: null })
    }

    const data = await res.json()
    return Response.json({ gifUrl: (data?.gifUrl as string) ?? null })
  } catch (err) {
    console.error('ExerciseDB gif fetch failed:', err)
    return Response.json({ gifUrl: null })
  }
}
