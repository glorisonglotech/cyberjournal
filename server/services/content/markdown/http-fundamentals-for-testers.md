## The protocol is the attack surface

Every request carries assumptions: which method, which host, which credentials,
which cache. Servers and intermediaries disagree about those assumptions, and
disagreement is exploitable.

## Learning objectives

- Describe the request/response lifecycle including intermediaries.
- Predict behaviour from method and status semantics.
- Explain caching, content negotiation and connection handling.
- Recognise where proxy and framework interpretations diverge.

## Prerequisites

- curl.
- A browser with DevTools.
- One lab target.

## The lifecycle

```text
client -> proxy/CDN -> load balancer -> application -> database
```

Each hop may rewrite headers, normalise paths or cache responses. A request that
looks identical in the browser can arrive differently at the application.

## Methods

| Method | Safe | Idempotent | Notes |
| --- | --- | --- | --- |
| GET | yes | yes | Must not change state |
| HEAD | yes | yes | Headers only; sometimes bypasses checks |
| POST | no | no | Creates or submits |
| PUT | no | yes | Replaces a resource |
| PATCH | no | no | Partial update |
| DELETE | no | yes | Removes |
| OPTIONS | yes | yes | Capabilities, CORS preflight |

Test method handling explicitly:

```bash
for m in GET POST PUT PATCH DELETE OPTIONS; do
  printf '%-8s ' "$m"
  curl -s -o /dev/null -w '%{http_code}\n' -X "$m" https://target.example/api/users/1
done
```

A `DELETE` that succeeds with a normal user token is a finding.

## Status codes in practice

| Code | Testing meaning |
| --- | --- |
| 200 | Success; verify the body belongs to the caller |
| 201 | Created; check what was created and for whom |
| 204 | No content; state change happened |
| 301/302/307/308 | Redirect; note method preservation |
| 400 | Shape rejected; try variants |
| 401 | No valid credentials |
| 403 | Authenticated, not allowed |
| 404 | May hide an existing protected resource |
| 405 | Method not allowed; try others |
| 429 | Rate limited; note the key |
| 500 | Error; often leaks detail |

## Headers as contracts

| Header | Contract |
| --- | --- |
| `Host` | Which virtual host |
| `Content-Type` | How to parse the body |
| `Content-Length` | Body size |
| `Transfer-Encoding` | Chunked framing |
| `Authorization` | Credentials |
| `Cookie` | Ambient credentials |
| `Origin` | Initiating origin |
| `Referer` | Previous page |
| `Cache-Control` | Storage rules |
| `Vary` | Cache key dimensions |

Request smuggling lives in `Content-Length` / `Transfer-Encoding` disagreements.
Cache poisoning lives in `Vary` and unkeyed headers. Both start with reading these
headers carefully.

## Caching

```http
Cache-Control: public, max-age=300
Vary: Accept-Encoding
```

- `public` responses may be stored by shared caches.
- `private` restricts to the browser.
- `no-store` forbids storage.
- `Vary` defines which request headers separate cache entries.

Test: request the same URL with two sessions and compare `Age`, `X-Cache` or
`CF-Cache-Status`. Identical cached content across users is a data exposure bug.

## Content negotiation

```http
Accept: application/json
```

Changing `Accept` or appending `.json` can reveal an API view of a page with more
fields. Test:

```bash
curl -s -H 'Accept: application/json' https://target.example/account
curl -s https://target.example/account.json
```

## Connections and HTTP/2

- HTTP/1.1 keep-alive allows request smuggling via framing.
- HTTP/2 uses binary framing; downgrade paths can reintroduce ambiguity.
- Proxies may speak different versions on each side.

```bash
curl --http2 -sI https://target.example/
```

## Encoding and normalisation

| Layer | May normalise |
| --- | --- |
| Browser | URL encoding |
| CDN | Path decoding, case |
| Framework router | Trailing slash, dot segments |
| Application | Query parsing |

Test the same logical path in several encodings:

```bash
for p in '/admin' '/%61dmin' '/admin/' '//admin' '/./admin' '/admin%2f..%2fadmin'; do
  printf '%-18s ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example$p"
done
```

## Common mistakes

- Ignoring `HEAD` and `OPTIONS` when testing access control.
- Assuming a 404 means no resource.
- Treating redirects as equivalent to the destination response.
- Missing cache behaviour on authenticated pages.
- Forgetting that the proxy may alter headers before the app sees them.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Raw requests | curl |
| Interception | Burp Suite |
| Header analysis | DevTools |
| HTTP/2 testing | curl `--http2`, nghttp2 |

## Practice lab

1. Send all seven methods to one endpoint and record status codes.
2. Compare a page with `Accept: text/html` and `application/json`.
3. Check whether an authenticated page is cacheable.
4. Request one protected path in five encodings.
5. Explain the response differences in terms of intermediaries.

## Further reading

- RFC 9110 — HTTP semantics.
- RFC 9111 — HTTP caching.
- RFC 9113 — HTTP/2.
- PortSwigger — request smuggling research.
