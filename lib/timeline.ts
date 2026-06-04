export function calcNowLinePercent(
  nowMinutes: number,
  startMinutes: number,
  endMinutes: number,
): number {
  if (nowMinutes <= startMinutes) return 0
  if (nowMinutes >= endMinutes) return 100
  return ((nowMinutes - startMinutes) / (endMinutes - startMinutes)) * 100
}
