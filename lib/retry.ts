export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
    jitter?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true, jitter = true } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        let delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        
        if (jitter) {
          // Add random jitter of +/- 20%
          const jitterAmount = delay * 0.2;
          delay = delay - jitterAmount + Math.random() * (jitterAmount * 2);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
