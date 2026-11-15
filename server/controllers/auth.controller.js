import { User } from "../models/User.js";
import { validateLogin } from "../utils/validate.js";
import { cookieOptions, signToken, TOKEN_COOKIE } from "../utils/tokens.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isEmail } from "../utils/sanitize.js";

export const login = asyncHandler(async (req, res) => {
  const { values, errors } = validateLogin(req.body);
  if (errors.length) {
    return res.status(422).json({ message: errors[0], errors });
  }

  const query = isEmail(values.identifier)
    ? { email: values.identifier.toLowerCase() }
    : { username: values.identifier.toLowerCase() };

  const user = await User.findOne(query).select("+password");

  // Constant-ish response for unknown users and bad passwords.
  if (!user || !(await user.comparePassword(values.password))) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie(TOKEN_COOKIE, signToken(user), cookieOptions());

  return res.json({ user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  const fresh = await User.findById(req.user._id).lean();
  return res.json({
    user: {
      _id: fresh._id,
      username: fresh.username,
      email: fresh.email,
      role: fresh.role,
      createdAt: fresh.createdAt,
      lastLoginAt: fresh.lastLoginAt,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  // Bump the token version so every token issued before this sign-out fails
  // verification. The account is single-administrator, so ending all sessions
  // is the safer behaviour.
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });

  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(TOKEN_COOKIE, options);
  return res.json({ message: "Signed out." });
});
