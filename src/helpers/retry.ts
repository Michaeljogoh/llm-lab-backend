export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { status?: number; message?: string; statusCode?: number };
  const code = err.status ?? err.statusCode;
  if (code === 429) return true;
  const msg = (err.message ?? '').toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate');
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 4,
  baseDelayMs = 1500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === maxRetries - 1) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastError;
}
