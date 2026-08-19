// Palette violet → magenta → orange, dans laquelle chaque cours pioche
// une couleur stable dérivée d'un hash de son nom.
const COURSE_COLOR_PALETTE = [
  '#7C5CFC', // violet
  '#9B8FFF', // violet clair
  '#B45CFC', // violet-magenta
  '#C9006B', // magenta
  '#FF6B9D', // rose-magenta
  '#FF7A45', // orange
  '#FF9F45', // orange clair
]

export function hashCourseColor(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return COURSE_COLOR_PALETTE[Math.abs(hash) % COURSE_COLOR_PALETTE.length]
}
