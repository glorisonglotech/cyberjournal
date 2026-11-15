## Know the application before you test it

Reconnaissance for a pentest answers different questions than bounty recon: what
technology is this, how is it deployed, where are the authentication boundaries,
and which parts are third-party?

## Learning objectives

- Fingerprint the stack without relying on a single header.
- Discover virtual hosts and non-linked routes.
- Map authentication and authorisation surfaces.
- Identify third-party components and their ownership.

## Prerequisites

- nmap, whatweb, curl, httpx.
- Burp Suite for traffic review.
- The scope document.

## Step 1 — Network position

```bash
nmap -Pn -p- --min-rate 1000 -oG scan.txt target.example
nmap -Pn -sV -sC -p 80,443,8080,8443 target.example
```

Record: open ports, service versions, TLS certificate names (which often reveal
additional hostnames), and whether a WAF or CDN fronts the application.

## Step 2 — HTTP fingerprinting

```bash
curl -s -I https://target.example/ | sort
whatweb -a 3 https://target.example
```

Headers are hints, not proof. Confirm with behaviour:

| Signal | Confirmation |
| --- | --- |
| `X-Powered-By: Express` | Error page format, `ETag` style |
| Cookie name `PHPSESSID` | `.php` routes, `X-Powered-By` |
| `Server: nginx` | 404 body style, header ordering |
| React SPA | `__NEXT_DATA__`, `/static/js/` bundles |
| WordPress | `/wp-json/`, `/wp-login.php` |

## Step 3 — Virtual hosts

One IP often serves several applications. Test by changing the `Host` header:

```bash
for vhost in admin internal staging api; do
  printf '%-10s ' "$vhost"
  curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
    -H "Host: $vhost.target.example" https://target.example/
done
```

A different body size or status for a vhost is a lead. Include the discovery in
scope checks: a vhost may be out of scope even if the IP is in scope.

## Step 4 — Route discovery from the client

Modern applications hide most of their surface in JavaScript. Review bundles:

```bash
curl -s https://target.example/static/js/main.js | grep -oE '"/api/[a-zA-Z0-9/_-]+"' | sort -u
```

Also inspect:

- `robots.txt` and `sitemap.xml` (they list what the owner wants hidden less).
- Source maps (`*.js.map`).
- Service worker files.
- Mobile app bundles, if in scope.

## Step 5 — Authentication surface

Map every way in:

| Mechanism | Where to look |
| --- | --- |
| Form login | `/login`, `/signin` |
| SSO | Redirect to an identity provider; note the `redirect_uri` |
| API tokens | `/api/tokens`, settings pages |
| Basic auth | `WWW-Authenticate` header |
| Invitations | `/invite`, `/accept` |
| Password reset | `/forgot`, `/reset` |

For each, note the session mechanism (cookie, bearer, both) and the roles
available.

## Step 6 — Third-party components

CDNs, chat widgets, payment iframes and analytics are usually out of scope for
exploitation but in scope for analysis: they change the security model.

```bash
curl -s https://target.example/ | grep -oE 'https://[a-z0-9.-]+' | sort -u | head -40
```

Document them. A payment iframe means card data never touches the application; a
chat widget means stored data leaves the boundary.

## Step 7 — Build the map

```text
Host            Stack           Auth        Third party       Notes
app.example     Next.js/Node    OIDC        Stripe, Segment   Main app
api.example     Express         Bearer      AWS               Documented API
admin.example   Django          Session     -                 Vhost, same IP
```

This table drives the rest of the engagement and the report's scope section.

## Common mistakes

- Trusting a single header for the stack.
- Skipping vhost checks because DNS resolved one name.
- Ignoring JavaScript bundles.
- Missing a second authentication mechanism (API tokens alongside SSO).
- Testing a third-party widget as if it were the client's code.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Ports and services | nmap |
| HTTP fingerprint | whatweb, httpx |
| Vhost discovery | curl, ffuf (`-H "Host: FUZZ"`) |
| Bundle review | curl, DevTools |
| Documentation | Markdown table |

## Practice lab

1. Scan a lab host and record service versions.
2. Fingerprint the stack and confirm two signals behaviourally.
3. Test five virtual host names on the same IP.
4. Extract API routes from a JavaScript bundle.
5. Produce the host map table with auth and third-party columns.

## Further reading

- OWASP WSTG — Information gathering and configuration testing.
- Nmap book — service detection and NSE.
- PortSwigger — Web cache and vhost concepts.
