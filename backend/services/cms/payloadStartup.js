const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function waitForPayloadContent({
  load,
  maxAttempts = positiveInteger(process.env.PAYLOAD_STARTUP_ATTEMPTS, 12),
  retryDelayMs = positiveInteger(process.env.PAYLOAD_STARTUP_RETRY_MS, 750),
  maxRetryDelayMs = positiveInteger(process.env.PAYLOAD_STARTUP_MAX_RETRY_MS, 3000),
  sleep = wait,
  onRetry,
} = {}) {
  if (typeof load !== 'function') throw new TypeError('Payload başlangıç yükleyicisi gereklidir');

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const status = await load();
      if (status?.ready) return { ...status, startupAttempts: attempt };
      lastError = new Error('Payload içerik deposu henüz hazır değil');
    } catch (error) {
      lastError = error;
    }

    if (attempt < maxAttempts) {
      const delayMs = Math.min(maxRetryDelayMs, retryDelayMs * attempt);
      onRetry?.({ attempt, delayMs, error: lastError });
      await sleep(delayMs);
    }
  }

  throw new Error(`Payload içerikleri ${maxAttempts} denemede hazırlanamadı: ${lastError?.message || 'bilinmeyen hata'}`, { cause: lastError });
}
