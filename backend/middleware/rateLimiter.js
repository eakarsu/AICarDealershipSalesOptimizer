// Rate limiter: 20 AI calls per hour per user (keyed by JWT user ID)
// Uses in-memory store (suitable for single-process deployments; swap for Redis in multi-process)

const rateLimitStore = new Map(); // key: userId, value: { count, windowStart }

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CALLS = 20;

function aiRateLimiter(req, res, next) {
  const userId = req.user && req.user.id;
  if (!userId) {
    // No user id — let auth middleware handle this; skip rate limiting
    return next();
  }

  const now = Date.now();
  const key = String(userId);
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Start a fresh window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= MAX_CALLS) {
    const resetIn = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You have reached the limit of ${MAX_CALLS} AI calls per hour. Please try again in ${resetIn} seconds.`,
      retry_after_seconds: resetIn,
    });
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  next();
}

module.exports = { aiRateLimiter };
