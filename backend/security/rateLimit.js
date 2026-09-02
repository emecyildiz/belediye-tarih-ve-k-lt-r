export function createRateLimit({ limit, windowMs, message = 'Çok fazla istek gönderildi. Lütfen daha sonra yeniden deneyin.' }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.socket?.remoteAddress || 'unknown';
    const current = buckets.get(key);
    const bucket = !current || now - current.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: message });
    }

    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets) {
        if (now - value.startedAt >= windowMs) buckets.delete(bucketKey);
      }
    }
    return next();
  };
}
