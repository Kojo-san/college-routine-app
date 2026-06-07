export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exerciseDbId: string }> },
) {
  const { exerciseDbId } = await params

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return Response.json({ gifUrl: null })
  }

  try {
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${encodeURIComponent(exerciseDbId)}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
        },
        next: { revalidate: 86400 },
      },
    )

    if (!res.ok) {
      return Response.json({ gifUrl: null })
    }

    const data = await res.json()
    return Response.json({ gifUrl: (data?.gifUrl as string) ?? null })
  } catch {
    return Response.json({ gifUrl: null })
  }
}
