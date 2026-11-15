## Sessions are configuration plus lifecycle

A session identifier is only as strong as its attributes, its rotation points and
the server's willingness to invalidate it. Most session bugs are configuration
bugs, and configuration is testable without exploitation.

## Learning objectives

- Audit cookie attributes and scope.
- Test rotation on login, privilege change and logout.
- Identify fixation and cross-subdomain risks.
- Recommend a session design that survives review.

## Prerequisites

- Burp Suite and browser DevTools.
- Two accounts.
- A target with cookie-based authentication.

## Step 1 — Inventory cookies

```bash
curl -sI https://target.example/login | grep -i '^set-cookie'
```

For each cookie record:

| Property | Expected |
| --- | --- |
| `HttpOnly` | Present on session cookies |
| `Secure` | Present in production |
| `SameSite` | `Lax` or `Strict` unless cross-site is required |
| `Domain` | Host-only unless subdomains need it |
| `Path` | `/` for session cookies |
| `Max-Age` | Reasonable lifetime |
| Name | Not revealing framework defaults unnecessarily |

## Step 2 — Scope and duplication

A cookie on `.example.com` is sent to every subdomain, including ones that host
user content or third-party apps. That turns any subdomain XSS into session theft.

Duplicate names on different paths are also a problem: the application may read
one while the browser sends both.

```http
Cookie: session=user; session=admin
```

Test by setting a same-named cookie with a conflicting path and observing which one
the server honours.

## Step 3 — Rotation

| Event | Expected |
| --- | --- |
| Login | New session identifier |
| Privilege change | New identifier |
| Password change | All other sessions invalidated |
| Logout | Identifier invalid server-side |
| Long idle | Expiry enforced server-side |

Test logout properly:

```bash
# Save the cookie before logout, then replay after
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Cookie: session=$SAVED" https://target.example/api/me
```

A `200` after logout means the server does not invalidate sessions. That matters
most on shared devices and after credential compromise.

## Step 4 — Fixation

Fixation occurs when an attacker can choose the session identifier and the server
accepts it after authentication.

Test:

1. Obtain a session cookie without logging in.
2. Log in using that same cookie value in the request.
3. Check whether the cookie value changes.

If it does not change, an attacker who can plant a cookie (via a subdomain, a
physical device, or a URL parameter that sets cookies) can ride the session.

## Step 5 — Cross-site behaviour

```http
Set-Cookie: session=abc; SameSite=None; Secure
```

`None` is required for cross-origin frontends but re-enables CSRF exposure unless
tokens and origin checks exist. Verify empirically:

- Does a cross-site POST include the cookie?
- Is there a CSRF token on state-changing endpoints?
- Does the server check `Origin`?

## Step 6 — Lifetime and storage

- Long-lived sessions increase the window for stolen cookies.
- Tokens in `localStorage` are reachable by XSS; cookies with `HttpOnly` are not.
- Session identifiers in URLs leak through logs and `Referer`.
- Remember-me tokens should be separate, rotating and revocable.

## Step 7 — The recommendation

```text
- Session cookie: HttpOnly; Secure; SameSite=Lax; Path=/; host-only domain.
- Rotate the identifier on login and privilege change.
- Store sessions server-side with an absolute and idle timeout.
- Invalidate on logout and password change.
- Add CSRF tokens to all state-changing requests.
- Never accept session identifiers from query parameters.
```

## Common mistakes

- Checking flags on one cookie and assuming all are equal.
- Testing logout by clearing cookies in the browser.
- Missing subdomain scope because the main app looks correct.
- Ignoring `SameSite=None` on API-driven frontends.
- Assuming a long `Max-Age` is a finding without a theft path.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Cookie inspection | DevTools, curl |
| Request replay | Burp Suite |
| Cross-site tests | local HTML page |
| Session comparison | Burp Comparer |

## Practice lab

1. Inventory every cookie set by a lab login.
2. Compare the identifier before and after login.
3. Replay a saved cookie after logout.
4. Test whether a session cookie is sent to a subdomain.
5. Write the cookie configuration you would recommend.

## Further reading

- OWASP WSTG — Session management testing (WSTG-SESS).
- OWASP — Session Management Cheat Sheet.
- MDN — Set-Cookie and SameSite documentation.
