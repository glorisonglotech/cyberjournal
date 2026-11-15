## CSRF did not disappear

Cross-site request forgery exploited browsers that sent credentials
automatically. `SameSite=Lax` removed the easiest cases. It did not remove
missing token validation, method confusion, or endpoints that rely on
cross-site navigation.

## Learning objectives

- Determine whether a state-changing request is protected by a token, an origin
  check, or only a cookie.
- Test SameSite behaviour empirically rather than assuming it.
- Identify state-changing GET requests and method overrides.
- Build a proof of concept that a triager can reproduce.

## Prerequisites

- Two accounts plus a local HTTP server for hosting a PoC page.
- Burp Suite.
- An understanding of cookie `SameSite` values.

## What makes a request forgeable

Three conditions must hold:

1. The request changes state.
2. The server authenticates it using ambient credentials (a cookie).
3. The server cannot distinguish a genuine request from a forged one.

The third condition is where testing happens.

## Step 1 — Find state changes

Capture every request that creates, updates, deletes or transfers:

```text
POST /settings/email       change contact address
POST /account/password     change password
POST /api/keys             create API key
GET  /account/delete       delete account (yes, really)
```

A `GET` that changes state is already a strong finding: the browser will send it
from an `<img>` tag with no interaction.

## Step 2 — Inspect the defences

Look for a token in the body, a custom header, or an origin check.

```http
POST /settings/email HTTP/1.1
Host: app.example.com
Cookie: session=abc123
Content-Type: application/x-www-form-urlencoded

email=new@example.com&csrf_token=8f14e45fceea
```

Remove the token and resend:

- If the request succeeds, token validation is missing.
- If it fails, test whether the token is bound to the session:
  use your token with another account's cookie.
- Test token reuse: the same token twice.

Also try changing the value to a predictable one (`1`, `null`, an empty string).
Weak implementations compare format rather than value.

## Step 3 — Test SameSite behaviour

`SameSite=Lax` allows top-level GET navigations but blocks cross-site POSTs.
`SameSite=None` allows everything, and is required for cross-site deployments.

Practical test: host a page on a different origin and submit a form.

```html
<!-- served from http://localhost:8000/poc.html -->
<form action="https://app.example/settings/email" method="POST">
  <input name="email" value="attacker@example.com" />
</form>
<script>document.forms[0].submit();</script>
```

If the action succeeds, cookies were sent cross-site. Check the cookie flags in
the response first: `SameSite=None` without `Secure` is ignored by modern
browsers, which can mask the issue.

> [!NOTE]
> A CSRF PoC must be hosted on a different site, not a different path on the same
> site. Same-site includes subdomains, so `evil.example.com` against
> `app.example.com` is not a valid cross-site test.

## Step 4 — Method and content-type confusion

Servers often validate tokens for `application/json` but not for form encoding,
or vice versa:

```http
POST /api/settings HTTP/1.1
Content-Type: text/plain

{"email":"attacker@example.com"}
```

If the framework parses the body regardless of `Content-Type`, a cross-site
`fetch` with `text/plain` may succeed without a preflight.

Also test method overrides:

```http
POST /api/users/1 HTTP/1.1
X-HTTP-Method-Override: DELETE
```

## Step 5 — Login CSRF

A login form that accepts a cross-site POST lets an attacker sign the victim into
the attacker's account. Consequences: the victim's activity is recorded in the
attacker's account, and the victim may upload sensitive data there.

Test by submitting the login form from another origin and observing whether the
session cookie changes.

## Step 6 — The proof

A defensible PoC shows:

1. The HTML page (short, complete).
2. The request it triggers, with cookies.
3. The resulting state change, visible in the victim's account.

Record a short screen capture if the flow involves multiple steps. Do not use a
real user's account or data.

## The fix

- Validate a per-session, unpredictable token on every state-changing request.
- Reject requests whose `Origin` or `Referer` is not allow-listed (defence in depth).
- Set `SameSite=Lax` or `Strict` on session cookies where possible.
- Never accept state changes over `GET`.
- Do not rely on custom headers alone; they help, but token validation is the control.

```js
// Express example: double-submit or session-bound token
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const sent = req.get("x-csrf-token") || req.body?._csrf;
  if (!sent || sent !== req.session.csrfToken) {
    return res.status(403).json({ message: "Invalid CSRF token." });
  }
  next();
});
```

## Common mistakes

- Testing from the same site and concluding CSRF is impossible.
- Ignoring `SameSite=None` cookies set for cross-site deployments.
- Missing token binding checks (token valid but not tied to the session).
- Forgetting JSON endpoints, which are forgeable when `Content-Type` is loose.
- Reporting a CSRF with no state change (a search form is not a finding).

## Toolbox

| Purpose | Tool |
| --- | --- |
| Request capture | Burp Suite |
| PoC hosting | `python3 -m http.server` |
| Token analysis | Burp Comparer |
| Cookie inspection | DevTools Application tab |

## Practice lab

1. Find a state-changing request on a lab app and identify its CSRF defence.
2. Remove the token and resend; record the result.
3. Reuse your token with a second account's session.
4. Host a cross-origin form and test whether the action succeeds.
5. Test a JSON endpoint with `Content-Type: text/plain`.

## Further reading

- OWASP — CSRF Prevention Cheat Sheet.
- PortSwigger Academy — CSRF labs.
- MDN — SameSite cookies explained.
