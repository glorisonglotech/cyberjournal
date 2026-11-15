import rateLimit from "express-rate-limit";

const limitMessage = (message) => ({ message });

const isProduction = () => process.env.NODE_ENV === "production";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many requests. Please slow down."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: limitMessage("Too many sign-in attempts. Try again in 15 minutes."),
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many changes at once. Wait a moment and retry."),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Upload limit reached. Try again later."),
});

/**
 * Origins allowed to talk to the API. Production trusts only CLIENT_ORIGIN
 * (a comma-separated allow-list, so a custom domain and a Netlify URL can
 * coexist); loopback origins are added for local development only, so a
 * production build never accepts requests from a developer machine.
 */
export function allowedOrigins() {
  const configured = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const development = isProduction()
    ? []
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
      ];

  return new Set([...configured, ...development]);
}

/**
 * Rejects cross-site state-changing requests. The session cookie is
 * SameSite=Lax/None depending on deployment, so this is a second, explicit
 * layer for API clients that might forward cookies.
 */
export function sameOriginGuard(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  const normalised = String(origin).replace(/\/+$/, "");
  if (!allowedOrigins().has(normalised)) {
    return res.status(403).json({ message: "Cross-site request blocked." });
  }
  return next();
}
