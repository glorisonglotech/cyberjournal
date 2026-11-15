## Defaults are the vulnerability

Misconfiguration findings come from comparing what is deployed with what should be
deployed. They are found by looking, not by fuzzing, and they are frequently the
easiest findings to remediate.

## Learning objectives

- Review headers, methods and default content systematically.
- Test CORS, directory listing and TLS configuration.
- Identify exposed administrative interfaces.
- Write findings that separate cosmetic issues from real risk.

## Prerequisites

- curl, nmap, testssl.sh.
- A target with permission to inspect configuration.
- The application's intended behaviour as a baseline.

## Step 1 — Security headers

```bash
curl -sI https://target.example/ | sort
```

| Header | Expected | Risk if missing |
| --- | --- | --- |
| `Strict-Transport-Security` | Present | Downgrade and cookie theft |
| `Content-Security-Policy` | Present, restrictive | XSS impact amplification |
| `X-Content-Type-Options` | `nosniff` | MIME confusion |
| `X-Frame-Options` / `frame-ancestors` | Deny or same-origin | Clickjacking |
| `Referrer-Policy` | Strict | Token leakage via `Referer` |
| `Permissions-Policy` | Restrictive | Feature abuse |

Missing headers alone are usually informational. Report them with the specific
impact they enable on this application.

## Step 2 — Methods and default routes

```bash
for m in OPTIONS TRACE PUT DELETE; do
  printf '%-8s ' "$m"
  curl -s -o /dev/null -w '%{http_code}\n' -X "$m" https://target.example/
done
```

`TRACE` enabled is a minor finding (Cross-Site Tracing). `PUT` enabled on the web
root is serious. Also check:

```bash
for p in /server-status /server-info /nginx_status /actuator /debug /console; do
  printf '%-16s ' "$p"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example$p"
done
```

## Step 3 — Directory listing

```bash
curl -s https://target.example/uploads/ | head -20
```

A listing page (`Index of /`) exposes filenames, which often reveal backups,
source archives and user uploads. Test directories discovered during enumeration,
not only the web root.

## Step 4 — CORS

```bash
curl -s -I https://target.example/api/me \
  -H 'Origin: https://evil.example' | grep -i 'access-control'
```

| Response | Meaning |
| --- | --- |
| No ACAO header | Not CORS-enabled for this origin |
| `ACAO: https://evil.example` | Any origin reflected — dangerous with credentials |
| `ACAO: *` | No credentials allowed; check what data is exposed |
| `ACAO` + `ACAC: true` + reflected origin | Critical when the endpoint returns private data |

Also test a null origin and a sibling subdomain.

## Step 5 — TLS

```bash
testssl.sh --quiet https://target.example
```

Focus on: protocol versions (TLS 1.0/1.1), weak ciphers, certificate validity,
HSTS preload, and mixed content. Report protocol support only if it is exploitable
in context; many programmes treat it as informational.

## Step 6 — Exposed administrative interfaces

| Interface | Risk |
| --- | --- |
| Database admin (phpMyAdmin) | Credential attacks, data access |
| Cache console (Redis, Memcached) | Data exposure, RCE in some setups |
| JMX / Actuator | Environment variables, heap dumps |
| Kubernetes dashboard | Cluster access |
| CI/CD UI | Source and secrets |

Access to a login page is not access to the system. Demonstrate only what you can
reach without credentials.

## Step 7 — Separate real risk from noise

| Finding | Typical severity |
| --- | --- |
| Directory listing with user uploads | Medium to high |
| CORS reflecting origin on authenticated endpoint | High |
| Missing HSTS without a downgrade path | Low |
| `TRACE` enabled | Low |
| Default admin page reachable but authenticated | Medium |
| Verbose stack traces | Low to medium |

Write the impact, not the checklist item.

## Common mistakes

- Reporting every missing header as a vulnerability.
- Testing CORS without credentials (`ACAC`).
- Confusing a login page with an exposed system.
- Ignoring non-web services on the same host.
- Missing per-path configuration differences.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Headers | curl, Burp |
| TLS | testssl.sh, sslscan |
| Default paths | ffuf, curl |
| Server scanning | nikto (with permission) |

## Practice lab

1. Record all security headers for a lab host.
2. Test methods and three default paths.
3. Check for directory listing in an uploads directory.
4. Test CORS with a foreign origin and with credentials.
5. Classify five findings by real risk and justify each.

## Further reading

- OWASP WSTG — Configuration and deployment testing (WSTG-CONF).
- OWASP Secure Headers Project.
- MDN — CORS documentation.
