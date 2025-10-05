const rateLimiters = new Map();

export const rateLimiter = (req, res, next) => {
  const userKey = req.user ? req.user.id : req.ip;
  const currentTime = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  if (!rateLimiters.has(userKey)) {
    rateLimiters.set(userKey, []);
  }

  const timestamps = rateLimiters.get(userKey).filter((t) => currentTime - t < windowMs);
  timestamps.push(currentTime);
  rateLimiters.set(userKey, timestamps);

  if (timestamps.length > maxRequests) {
    return res.status(429).json({
      error: { code: "RATE_LIMIT", message: "Too many requests, slow down!" },
    });
  }

  next();
};
