/**
 * Exponential backoff retry utility for Stellar/Soroban API calls.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const delay = baseDelayMs * Math.pow(2, attempt - 2);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
    }
  }

  throw lastError;
}
