## A token is only as good as its verification

JSON Web Tokens are a format, not a security control. The library and the
verification call decide whether the token means anything.

## Learning objectives

- Decode a token and identify what the application trusts.
- Test algorithm handling, signature verification and claim validation.
- Recognise weak-secret risk and when cracking is appropriate.
- Apply a verification checklist that survives library upgrades.

## Prerequisites

- A target that issues JWTs.
- `jwt_tool`, hashcat, and Burp Suite.
- Basic familiarity with base64url encoding.

## Step 1 — Decode

```bash
TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
echo "$TOKEN" | cut -d. -f1 | base64 -d 2>/dev/null; echo
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null; echo
```

Typical header:

```json
{"alg":"HS256","typ":"JWT"}
```

Typical payload:

```json
{"sub":"42","role":"user","tenant":"acme","iat":1763000000,"exp":1763604800}
```

Ask: which of these claims does the server actually check? Role and tenant claims
are frequently trusted without a database lookup.

## Step 2 — Test claim trust

With a valid token of your own, change a claim and re-sign only if you have the
secret. Without the secret, test claims the server ignores the signature for —
rare, but it happens with misconfigured gateways.

More practical: test whether the server honours `role` from the token at all. If
your role is `user` and the admin endpoint accepts your token, the finding is
broken access control, not JWT.

## Step 3 — Algorithm confusion

| Variant | What to test |
| --- | --- |
| `alg: none` | Remove the signature; does it validate? |
| HS256 vs RS256 | Sign with the public key as an HMAC secret |
| `kid` injection | Path traversal or SQL in the key ID |
| `jku` / `x5u` | Point at an attacker-controlled key set |

```bash
# jwt_tool: try the none algorithm and common confusion attacks
python3 jwt_tool.py "$TOKEN" -M at
```

An accepted `none` token means the library was called without an algorithms
allow-list. That is a critical authentication bypass.

## Step 4 — Weak secrets

If the token uses HMAC, a short secret is crackable offline.

```bash
hashcat -a 0 -m 16500 token.txt wordlist.txt
```

Only attempt this when the programme permits it and the token is yours. A cracked
secret lets you forge any token, which is critical — but demonstrating it with a
role change on your own account is enough.

## Step 5 — Expiry and revocation

| Property | Test |
| --- | --- |
| `exp` | Wait past expiry; retry |
| `nbf` | Token valid before its start time? |
| Revocation | Logout, then replay the token |
| Rotation | Does refresh issue a new token and invalidate the old one? |

A token that works after logout is a finding when sessions are expected to end.

## Step 6 — Storage and transport

- Tokens in `localStorage` are readable by any XSS.
- Tokens in URLs leak through logs and `Referer`.
- Tokens in cookies need `HttpOnly`, `Secure` and appropriate `SameSite`.

Report storage issues together with the XSS or logging path that exploits them,
not in isolation.

## The secure verification checklist

```js
import jwt from "jsonwebtoken";

const payload = jwt.verify(token, publicKey, {
  algorithms: ["RS256"],       // explicit allow-list
  issuer: "https://auth.example.com",
  audience: "api.example.com",
  clockTolerance: 5,
  maxAge: "1h",
});
```

- Pin the algorithm.
- Verify signature before reading claims.
- Validate `iss`, `aud`, `exp` and `nbf`.
- Do not trust role or tenant claims for authorisation without a server-side check.
- Keep key material out of source control; rotate on suspicion.
- Use short access-token lifetimes with refresh tokens.

## Common mistakes

- Decoding a token and assuming the payload is what the server trusts.
- Testing `alg:none` against a library that already rejects it, then stopping.
- Claiming a JWT vulnerability from a token that is not used for authorisation.
- Cracking secrets on tokens that are not yours.
- Missing that cookies and tokens are both in play.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Decode and mutate | jwt_tool, jwt.io |
| Secret cracking | hashcat (`-m 16500`) |
| Request replay | Burp Suite |
| Key inspection | openssl |

## Practice lab

1. Decode a lab token and list every claim.
2. Test `alg:none` with `jwt_tool`.
3. Change `role` and re-sign using a known lab secret.
4. Replay a token after logout.
5. Harden a sample verification call with an explicit algorithm allow-list.

## Further reading

- RFC 7519 — JSON Web Token.
- OWASP — JWT cheat sheet.
- PortSwigger Academy — JWT labs.
