## Configure once, test for months

Most Burp frustration comes from configuration, not features. A five-minute setup
prevents scope mistakes, noisy history and sessions that cannot be reproduced.

## Learning objectives

- Configure the proxy, CA certificate and browser correctly.
- Set target scope so history and tools stay relevant.
- Use Repeater deliberately instead of re-sending blindly.
- Keep a project file that preserves evidence.

## Prerequisites

- Burp Suite Community or Professional.
- Firefox or Chromium with a separate testing profile.
- A lab target you are authorised to test.

## Step 1 — Proxy and certificate

1. Start Burp; confirm the proxy listener on `127.0.0.1:8080`.
2. Configure the browser to use it (FoxyProxy or manual settings).
3. Visit `http://burp` and download the CA certificate.
4. Import it into the browser's trust store, or into the system store for `curl`.

Verify with:

```bash
curl -s -x http://127.0.0.1:8080 https://target.example/ -o /dev/null -w '%{http_code}\n'
```

If that fails while the browser works, `curl` is not trusting the CA.

> [!WARNING]
> Use a dedicated browser profile for testing. Mixing personal browsing with an
> intercepting proxy leaks session cookies into your project history.

## Step 2 — Scope

Target → Scope → add the in-scope hosts. Then enable
**"Do not send items to Proxy history or other Burp tools"** for out-of-scope
items, and use the scope filter in every tool.

Scope is not cosmetic:

- History stays readable.
- Intruder does not accidentally attack an out-of-scope host.
- Scanner (Pro) does not crawl third-party assets.

## Step 3 — Site map as an inventory

Browse the application normally with the proxy on. The site map becomes a list of
every route you have visited, including API calls the interface makes silently.

Practical habits:

- Right-click a host → "Add to scope".
- Use the filter to hide static assets.
- Annotate interesting requests with a colour and a note.

## Step 4 — Repeater discipline

Repeater is where most manual testing happens. Treat each tab as a lab notebook:

1. Rename the tab after the hypothesis (`idor-invoice-4821`).
2. Keep the original request unchanged in a second tab.
3. Change one variable per send.
4. Save the interesting response (right-click → save response).

```http
GET /api/invoices/4821 HTTP/1.1
Host: app.example.com
Authorization: Bearer <token-of-user-A>
```

Change only the ID, then only the token. If both change at once, you learn nothing.

## Step 5 — Match and replace

Proxy → Options → Match and replace is the cleanest way to test header behaviour
across a whole session:

| Type | Match | Replace | Purpose |
| --- | --- | --- | --- |
| Request header | `User-Agent: .*` | a mobile UA | Mobile-only routes |
| Request header | `X-Forwarded-For: .*` | `127.0.0.1` | Trusted-IP checks |
| Response header | `Content-Security-Policy: .*` | *(empty)* | Test XSS impact |

Disable each rule when you are done. A forgotten rule invalidates later evidence.

## Step 6 — Organising a project

Community edition keeps state in memory only, so export before closing:

- **Project options → Save project options** (Pro: save the project file).
- Export Repeater tabs you care about as requests.
- Keep a `notes.md` beside the exports.

## What Community edition cannot do

| Feature | Community | Workaround |
| --- | --- | --- |
| Scanner | No | Manual testing, or a lab scanner separately |
| Intruder speed | Throttled | ffuf for volume fuzzing |
| Saving projects | Limited | Export evidence manually |
| Extensions | Limited BApp access | Use standalone tools |

Community is enough for access control, authentication and injection testing. Do
not let the missing scanner push you into random automation.

## Common mistakes

- Testing out of scope because the proxy forwarded everything.
- Forgetting to disable a match-and-replace rule.
- Sending the same request twenty times without changing a variable.
- Losing the request that produced a finding.
- Trusting the browser's rendering of a response instead of the raw body.

## Toolbox

| Need | Tool |
| --- | --- |
| Interception | Burp Proxy |
| Manual mutation | Repeater |
| Volume fuzzing | ffuf (instead of throttled Intruder) |
| Header automation | Match and replace |
| Evidence | Saved requests and responses |

## Practice lab

1. Configure Burp with a dedicated browser profile and verify with `curl -x`.
2. Set scope to a single lab host and confirm out-of-scope traffic is dropped.
3. Browse a lab app and identify three API calls the interface made silently.
4. Test an ID parameter in Repeater with two accounts, changing one variable at a time.
5. Add a match-and-replace rule, test a header, then disable the rule.

## Further reading

- PortSwigger — Burp Suite documentation.
- PortSwigger Web Security Academy — Burp basics labs.
- OWASP WSTG — Testing tools and configuration.
