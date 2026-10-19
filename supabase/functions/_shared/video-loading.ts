// Progress estimates startup readiness, not the download of the entire file.
export function getVideoLoadingProgress(elapsedMs: number, readyState: number, bufferedSeconds: number, targetSeconds: number): number {
  if (readyState >= 3) return 100;
  const estimate = Math.floor(90 * (1 - Math.exp(-Math.max(0, elapsedMs) / 8000)));
  const stage = readyState >= 2 ? 70 : readyState >= 1 ? 35 : 1;
  const buffered = targetSeconds > 0 ? Math.floor(Math.max(0, bufferedSeconds) / targetSeconds * 95) : 0;
  return Math.min(95, Math.max(1, estimate, stage, buffered));
}