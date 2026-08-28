const defaultSleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const transientStatuses = new Set([502, 503, 504]);

export async function requestWithTransientRetry(request, {
  attempts = 6,
  baseDelayMs = 400,
  maxDelayMs = 2500,
  sleep = defaultSleep,
} = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await request();
      if (!transientStatuses.has(response.status) || attempt === attempts) return response;
      lastError = new Error(`Geçici API hatası: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }

    await sleep(Math.min(maxDelayMs, baseDelayMs * (2 ** (attempt - 1))));
  }

  throw lastError;
}
