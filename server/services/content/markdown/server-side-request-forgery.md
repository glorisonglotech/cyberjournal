## The server as a proxy you do not control

SSRF happens when an application fetches a URL you supplied. The server sits
inside the network, so its requests can reach things you cannot: metadata
services, internal admin panels, and databases on localhost.

## Learning objectives

- Identify URL-accepting features.
- Confirm SSRF with an out-of-band listener before probing internals.
- Bypass common allow-list and blocklist filters.
- Demonstrate impact with cloud metadata, safely and minimally.

## Prerequisites

- A lab with a URL-fetch feature (image import, webhook test, PDF renderer).
- Burp Collaborator or interactsh.
- Awareness of cloud metadata endpoints.

## Where to look

| Feature | Typical parameter |
| --- | --- |
| Image import from URL | `image_url`, `avatar` |
| Webhook configuration | `callback_url` |
| PDF or screenshot generation | `url`, `target` |
| RSS or feed reader | `feed` |
| File import | `source` |
| SSO metadata fetch | `metadata_url` |

Any feature that says "we will fetch this" is a candidate.

## Step 1 — Confirm out-of-band

Never start by requesting internal addresses. Confirm the server makes requests
at all.

```bash
# Start a listener you control (interactsh or Burp Collaborator)
interactsh-client
```

Submit a payload pointing at your listener:

```http
POST /api/import HTTP/1.1
Content-Type: application/json

{"image_url":"http://<unique-id>.oast.example/test"}
```

A DNS or HTTP hit proves server-side fetching. If nothing arrives, the feature may
be asynchronous, cached, or restricted to allow-listed domains.

## Step 2 — Map what the server can reach

Once confirmed, test reachability with non-sensitive targets:

```text
http://127.0.0.1:80
http://localhost:8080/actuator/health
http://169.254.169.254/latest/meta-data/
```

Use the smallest possible request. For cloud metadata, a single path that returns
the instance role name is enough to prove impact; do not retrieve credentials.

> [!WARNING]
> Metadata credentials are live secrets. Stop at demonstrating access. Storing or
> using them is outside a bounty's rules and often illegal.

## Step 3 — Filter bypasses

| Filter | Try |
| --- | --- |
| Blocks `127.0.0.1` | `2130706433`, `0x7f000001`, `0177.0.0.1`, `127.1` |
| Blocks `localhost` | `localtest.me`, `127.0.0.1.nip.io` |
| Requires `http://` prefix | `http://expected.com@127.0.0.1/` |
| Blocks private ranges | DNS rebinding to a public name that resolves internally |
| Validates the hostname | Redirect from an allowed host to the target |
| Blocks by extension | Path traversal in the URL path |

Redirect-based bypass:

```text
https://allowed.example/redirect?to=http://127.0.0.1:8080/
```

If the fetcher follows redirects, the allow-list check happens before the redirect
and never again.

## Step 4 — Blind SSRF

No response body is returned, but timing and errors still leak information:

- Open port: fast connection, different error.
- Closed port: connection refused.
- Filtered: timeout.

Compare response times for internal addresses to build a rough port map. Keep the
number of requests low; this is noisy for the target.

## Step 5 — Demonstrate impact

Rank your evidence:

| Evidence | Rating |
| --- | --- |
| DNS callback only | Low to medium |
| Internal service response body | High |
| Cloud metadata identity document | Critical |
| Metadata credentials retrieved | Critical, handle carefully |

Write the report around what the server can reach, not around the payload.

## The fix

1. **Allow-list destinations** by scheme and hostname, resolved and re-checked
   after redirects.
2. **Block link-local and private ranges** at the network layer, not only in code.
3. **Disable redirects** for fetchers, or re-validate every hop.
4. **Use a dedicated egress proxy** with its own allow-list.
5. **Require IMDSv2** in AWS and disable metadata access where unused.

```js
// Sketch: resolve, validate, then fetch without automatic redirects
const url = new URL(input);
if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad scheme");
const { address } = await dns.promises.lookup(url.hostname);
if (isPrivate(address)) throw new Error("blocked destination");
await fetch(url, { redirect: "manual" });
```

## Common mistakes

- Requesting metadata endpoints before confirming basic SSRF.
- Reporting a 500 error as proof without a callback.
- Testing only `127.0.0.1` and concluding the filter is solid.
- Ignoring redirect chains.
- Retrieving credentials and storing them.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Out-of-band confirmation | Burp Collaborator, interactsh |
| Request replay | curl, Burp Repeater |
| DNS rebinding | rebind.network-style services (in labs only) |
| Internal mapping | response timing |

## Practice lab

1. Find a URL-fetch feature in a lab and confirm a callback to your listener.
2. Request `http://127.0.0.1:80` and record the difference from a closed port.
3. Bypass a blocklist using an alternative representation of `127.0.0.1`.
4. Test a redirect-based bypass with a lab redirect endpoint.
5. Write the finding with a callback log and an impact statement.

## Further reading

- OWASP — SSRF Prevention Cheat Sheet.
- PortSwigger Academy — SSRF labs.
- Cloud provider documentation on instance metadata services.
