## Every web finding is an HTTP conversation

Before you learn payloads, learn to read the exchange. Most vulnerabilities are
visible as a mismatch between what the server trusts and what the client controls.

## Learning objectives

- Read a request line, headers, and body without skipping the boring parts.
- Interpret status codes in the context of access control.
- Reason about cookies, caching and encodings as trust boundaries.
- Capture evidence with `curl` that reproduces exactly what the browser sent.

## Prerequisites

- A terminal with `curl`.
- A browser with developer tools.
- One lab target.

## Anatomy of a request

```http
POST /api/v1/invoices/4821 HTTP/1.1
Host: app.example.com
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Origin: https://app.example.com
Cookie: session=abc123; theme=dark

{"amount": 1200, "currency": "EUR"}
```

Ask four questions of every request:

1. **Who does the server think I am?** Cookie, bearer token, mTLS, IP allow-list.
2. **What am I allowed to do?** Path, method and body all influence authorisation.
3. **What did I control?** IDs, amounts, headers, and JSON keys are all input.
4. **What will the response reveal?** Data, error text, or timing.

## Status codes as an access-control signal

| Code | Meaning in testing |
| --- | --- |
| 200 | Success — check whether the body is appropriate for *this* user |
| 201 / 204 | State change — verify it actually applied to your account only |
| 301 / 302 | Redirect — follow it manually; the destination may leak intent |
| 400 | Input rejected — try variants before concluding it is safe |
| 401 | Not authenticated — a different credential may work |
| 403 | Authenticated but forbidden — the endpoint exists |
| 404 | May be a deliberate mask for an existing protected resource |
| 405 | Method not allowed — try the other verbs |
| 500 | Server error — often the most informative response |

A `403` on `GET /admin/users` and a `200` on `GET /admin/users/1` is a classic
inconsistency: the collection is protected, the object is not.

## Headers that matter

| Header | Why it matters |
| --- | --- |
| `Host` | Virtual host routing; can bypass edge rules |
| `X-Forwarded-For` | Often trusted for IP allow-lists and rate limits |
| `X-Original-URL`, `X-Rewrite-URL` | Framework-specific path overrides |
| `Origin` / `Referer` | CSRF and CORS decisions |
| `Authorization` | Token handling, scheme confusion |
| `Cookie` | Session scope, flags, duplication |
| `Content-Type` | Parsers may disagree with the client |
| `Accept` | Response format switching |

Proxies and frameworks disagree about which header wins. That disagreement is a
recurring source of bugs.

## Cookies in one page

```http
Set-Cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800
```

- **HttpOnly** stops JavaScript from reading it — relevant to XSS impact.
- **Secure** restricts it to HTTPS.
- **SameSite** controls cross-site sending: `Strict`, `Lax`, `None`.
- **Domain** decides which subdomains receive it. A cookie scoped to
  `.example.com` is sent to every subdomain, including ones you do not control.
- **Path** is not a security boundary.

Two cookies with the same name on different paths is a classic confusion bug.

## Caching

```http
Cache-Control: public, max-age=60
```

A `public` cache on an authenticated response can serve one user's data to
another. Test by requesting the same URL twice with different sessions through a
cache-enabled path, and inspect `Age`, `X-Cache` and `CF-Cache-Status`.

## Encodings and parsing

Different layers decode differently:

```bash
# These may route to the same handler, or not
curl -s -o /dev/null -w '%{http_code}\n' https://target.example/admin
curl -s -o /dev/null -w '%{http_code}\n' https://target.example/%61dmin
curl -s -o /dev/null -w '%{http_code}\n' https://target.example/admin%2f..
```

If the WAF sees the decoded path and the application sees the raw one, access
control often fails open.

## Capturing reproducible evidence

Browser copy-paste loses details. Export the exact request:

```bash
curl -s -i https://app.example.com/api/v1/invoices/4821 \
  -H 'Authorization: Bearer <REDACTED>' \
  -H 'Accept: application/json' \
  -o response.txt -w '%{http_code}\n'
```

For a POST with JSON, keep the body in a file:

```bash
curl -s -i -X POST https://app.example.com/api/v1/invoices \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <REDACTED>' \
  --data @body.json
```

Redact tokens before sharing. A report does not need your live session.

## Common mistakes

- Reading only the response body and ignoring headers.
- Treating `404` as "does not exist" without testing variations.
- Forgetting that `OPTIONS` and `HEAD` sometimes bypass method checks.
- Assuming the browser sent what DevTools displays (proxies rewrite both).
- Not recording the exact request; the finding is then unreproducible.

## Toolbox

| Task | Tool |
| --- | --- |
| Raw requests | curl |
| Interception | Burp Suite, mitmproxy |
| Header inspection | browser DevTools |
| HTTP/2 specifics | curl `--http2`, nghttp |

## Practice lab

1. Capture a login request in Burp and reproduce it with `curl`.
2. Change one header at a time (`Origin`, `X-Forwarded-For`, `Host`) and record
   the response differences.
3. Find a response with `Cache-Control: public` and determine whether it contains
   user-specific data.
4. Test three path-encoding variants against one protected route.
5. Write a five-line note describing what each variation changed.

## Further reading

- RFC 9110 — HTTP semantics.
- RFC 6265 — cookies and their scoping rules.
- MDN — HTTP headers reference.
- OWASP WSTG — Test HTTP methods and headers.
