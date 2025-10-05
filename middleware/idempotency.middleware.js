const usedKeys = new Map();

export const idempotency = (req, res, next) => {
  if (req.method !== "POST") return next();

  const key = req.headers["idempotency-key"];
  if (!key) {
    return res.status(400).json({
      error: {
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key header is required for POST requests",
      },
    });
  }

  if (usedKeys.has(key)) {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_REQUEST",
        message: "Duplicate request detected for the same Idempotency-Key",
      },
    });
  }

  usedKeys.set(key, Date.now());

  setTimeout(() => usedKeys.delete(key), 10 * 60 * 1000);

  next();
};