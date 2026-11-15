import jwt from "jsonwebtoken";

export const TOKEN_COOKIE = "gcj_token";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random value (openssl rand -hex 48) in server/.env",
    );
  }
  return value;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, ver: user.tokenVersion || 0 },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}

/**
 * Session cookie options.
 *
 * When the client is hosted on a different site than the API (Netlify →
 * Render), browsers only send the cookie if it is `SameSite=None; Secure`.
 * Set COOKIE_SAME_SITE=none on the API in that architecture. Same-site
 * deployments keep the safer `lax` default.
 */
export function cookieOptions() {
  const requested = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(requested) ? requested : "lax";

  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === "none" ? true : process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS_MS,
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}
