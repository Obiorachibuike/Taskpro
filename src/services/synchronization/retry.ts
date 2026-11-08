export const MAX_SYNC_ATTEMPTS = 8;
export function retryDelayMs(attempts: number, baseMs = 1000, maxMs = 15 * 60 * 1000): number {
  if (!Number.isInteger(attempts) || attempts < 0) throw new Error('Attempts must be a non-negative integer');
  return Math.min(maxMs, baseMs * 2 ** attempts);
}
export function nextRetryDate(attempts: number, now = new Date(), baseMs = 1000): string {
  return new Date(now.getTime() + retryDelayMs(attempts, baseMs)).toISOString();
}
