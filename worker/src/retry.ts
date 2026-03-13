const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_MS = 1000;
const DEFAULT_MAX_MS = 10000;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_MS,
    maxDelayMs = DEFAULT_MAX_MS,
    onRetry,
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      onRetry?.(attempt, err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
