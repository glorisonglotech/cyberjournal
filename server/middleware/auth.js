import { User } from "../models/User.js";
import { TOKEN_COOKIE, verifyToken } from "../utils/tokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function extractToken(req) {
  if (req.cookies?.[TOKEN_COOKIE]) return req.cookies[TOKEN_COOKIE];
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ message: "Session no longer valid." });
  }

  // Tokens issued before the last sign-out are rejected, so logging out really
  // ends the session instead of only clearing the browser cookie.
  if ((payload.ver || 0) !== (user.tokenVersion || 0)) {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }

  req.user = user;
  return next();
});

export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this resource." });
    }
    return next();
  };
}
