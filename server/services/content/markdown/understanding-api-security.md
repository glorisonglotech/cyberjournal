## Why API breaches look different

A web application shows you its surface. An API hides it: endpoints are called by clients you did not write, parameters travel in JSON, and every object is addressable by an identifier. That combination produces three failure modes that scanners rarely catch — broken object-level authorisation, mass assignment, and tokens that are validated for existence rather than intent.

This tutorial works through each one with a vulnerable Express handler and the fix, because the pattern transfers to any framework.

## 1. Broken object-level authorisation (BOLA)

The endpoint is correct in every way except one: it authenticates the caller and then trusts the identifier they supplied.

```js
// vulnerable — authenticated, but not authorised
router.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Not found" });
  res.json(invoice);
});
```

The token proves *who* is asking. It says nothing about whether that user owns invoice `7f3a…`. Changing one character in a URL returns someone else's data.

```bash
# two accounts, same endpoint
curl -s -H "Authorization: Bearer $USER_A_TOKEN" \
  http://localhost:4000/api/invoices/65f1c0... | jq .customer
```

The fix is to make ownership part of the query, not an afterthought:

```js
router.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    owner: req.user.id,          // scope by the authenticated subject
  });
  if (!invoice) return res.status(404).json({ message: "Not found" });
  res.json(invoice);
});
```

> [!WARNING]
> Return `404`, not `403`, for objects the caller does not own. A `403` confirms the object exists, which is an enumeration primitive.

BOLA is consistently the top entry in the OWASP API Security Top 10 because it needs no exploit: a valid session and a loop over identifiers is enough.

## 2. Mass assignment

Frameworks make it easy to bind a request body onto a model. That convenience is the vulnerability.

```js
// vulnerable — every field in the body is assignable
router.patch("/api/users/me", requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
  res.json(user);
});
```

```http
PATCH /api/users/me HTTP/1.1
Content-Type: application/json

{ "displayName": "Glorison", "role": "admin", "credits": 999999 }
```

If the schema allows those fields, the update succeeds. The client never had to find an administrative endpoint.

The fix is an allow-list, applied before the data layer:

```js
const EDITABLE = ["displayName", "avatarUrl", "bio"];

router.patch("/api/users/me", requireAuth, async (req, res) => {
  const patch = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => EDITABLE.includes(key)),
  );

  if (Object.keys(patch).length === 0) {
    return res.status(422).json({ message: "No editable fields supplied" });
  }

  const user = await User.findByIdAndUpdate(req.user.id, patch, {
    new: true,
    runValidators: true,
  });
  res.json(user);
});
```

> [!TIP]
> Test this by sending a privileged field and checking the response, not the status code. A `200` with `"role": "admin"` is the finding.

## 3. Tokens: validate intent, not just signature

A JWT signature proves the token was issued by you. It does not prove the token should still work.

A realistic checklist for every token-consuming service:

| Check | Failure it prevents |
| --- | --- |
| Algorithm pinned server-side (`RS256`) | `alg: none`, HS/RS confusion |
| `exp` verified, clock skew bounded | Replay of old tokens |
| `aud` and `iss` verified | Token from another service accepted |
| Revocation or short lifetime | Stolen token valid for weeks |
| Role read from the database, not the claim | Privilege frozen after demotion |

```js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],   // never let the token choose
      issuer: "https://journal.local",
      audience: "journal-api",
    });
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid session" });
  }
}
```

Storing tokens in `localStorage` makes any XSS a full account takeover. For browser clients, an `HttpOnly`, `SameSite=Lax` cookie removes that path — and then requires CSRF protection, which is a fair trade to make deliberately.

## 4. The quieter failures

### Excessive data exposure

Returning the whole document is easier than shaping a response, and it leaks fields you never intended to publish:

```js
// leaks passwordHash, internalNotes, billingCustomerId
res.json(user);

// explicit projection
res.json({ id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl });
```

### Unlimited resource consumption

An endpoint that accepts a 50 MB JSON body or an unbounded `limit` parameter is a denial-of-service surface:

```js
app.use(express.json({ limit: "100kb" }));

const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
```

Pair that with per-identity rate limiting on authentication and write endpoints. Limit by account, not only by IP — attackers rotate IPs, accounts are expensive.

### Verb and content-type confusion

```bash
# does the API honour methods the client never sends?
curl -i -X DELETE http://localhost:4000/api/articles/123
curl -i -X POST http://localhost:4000/api/articles/123 -H "Content-Type: text/plain" -d '{"status":"published"}'
```

Test each endpoint with the wrong method, the wrong content type, and no body. Consistent `405`/`415` responses are a sign the routing layer is explicit.

## A test plan you can run in ten minutes

```bash
BASE=http://localhost:4000

# 1. authentication boundary
curl -i $BASE/api/admin/stats

# 2. object-level authorisation (swap ids between two accounts)
curl -i -H "Authorization: Bearer $TOKEN_B" $BASE/api/invoices/$ID_FROM_A

# 3. mass assignment
curl -i -X PATCH -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' $BASE/api/users/me

# 4. input size
python3 -c 'print("{\"bio\":\"" + "A"*2000000 + "\"}")' > /tmp/big.json
curl -i -X PATCH -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" --data @/tmp/big.json $BASE/api/users/me

# 5. rate limiting
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/api/auth/login \
    -H "Content-Type: application/json" -d '{"identifier":"a@b.c","password":"x"}'
done | sort | uniq -c
```

Expect: `401`, `404`, unchanged `role`, `413`, and a `429` after a handful of attempts.

## Lessons Learned

- **Authorisation belongs in the query**, next to the data it protects.
- **Allow-list fields, never block-list them.** New schema fields are silently exposed otherwise.
- **Pin the algorithm** and validate every claim you rely on.
- **Shape responses explicitly.** Serialisation is a security boundary.
- **Log authorisation failures.** A single account receiving `404` across many identifiers is an attack signature.

## References

- OWASP API Security Top 10 (2023)
- OWASP ASVS v4 — Chapter 4, Access Control
- RFC 8725 — JSON Web Token Best Current Practices
