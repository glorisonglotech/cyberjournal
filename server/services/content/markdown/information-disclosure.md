## Small leaks make good maps

Information disclosure rarely pays on its own. It pays when it shortens every
later step: stack traces reveal frameworks, headers reveal proxies, source maps
reveal endpoints, and verbose errors reveal schema.

## Learning objectives

- Systematically collect disclosure from errors, headers and static assets.
- Distinguish acceptable transparency from harmful leakage.
- Chain disclosure into a higher-impact finding.
- Report it at the right severity with the right evidence.

## Prerequisites

- Burp Suite and curl.
- A target with a few features that can fail.

## Step 1 — Force errors

Send structurally wrong requests and read the response:

```bash
curl -s -i 'https://target.example/api/users/%00'
curl -s -i 'https://target.example/api/users/not-an-id'
curl -s -i -X POST 'https://target.example/api/users' -H 'Content-Type: application/json' -d '{}'
```

Look for:

- Framework and version in stack traces.
- File paths and line numbers.
- SQL fragments or ORM queries.
- Internal hostnames.
- Debug flags.

A production application returning a stack trace is a finding, but its severity
depends on what the trace reveals.

## Step 2 — Read the headers

```bash
curl -s -I https://target.example/ | sort
```

| Header | What it can reveal |
| --- | --- |
| `Server`, `X-Powered-By` | Exact versions |
| `X-AspNet-Version` | Framework patch level |
| `Via`, `X-Cache` | Proxy and CDN topology |
| `X-Debug-Token` | Symfony profiler access |
| `X-Runtime` | Framework internals |
| `Set-Cookie` names | Framework defaults |

Remove the obvious ones, then check whether the version is actually vulnerable.
A version banner alone is informational.

## Step 3 — Static assets

```bash
# Source maps can reveal original source and internal endpoints
curl -s -o /dev/null -w '%{http_code}\n' https://target.example/assets/app.js.map

# Common leftover files
for f in .env .git/HEAD .DS_Store backup.zip config.json package.json; do
  printf '%-16s ' "$f"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example/$f"
done
```

A readable source map is valuable when it contains API keys, internal URLs or
unreleased features. A `.git/HEAD` is valuable when the repository can be
reconstructed (do not dump it; demonstrate access to one object).

## Step 4 — Debug and administrative surfaces

```bash
for path in /actuator /actuator/env /debug /__debug__ /server-status /phpinfo.php /telescope; do
  printf '%-16s ' "$path"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example$path"
done
```

A 200 on `/actuator/env` can expose configuration and credentials. Stop at reading
the keys — do not use them.

## Step 5 — Differential disclosure

Compare responses across users and roles:

- Does an error message differ when a resource exists but is forbidden?
- Does a search endpoint reveal the total count of hidden records?
- Does an export include fields the UI hides?

The last one is often a high-severity finding disguised as disclosure.

## Step 6 — Chain it

| Disclosure | Chain |
| --- | --- |
| Internal hostname | SSRF target |
| API key in source map | Direct API access |
| Verbose SQL error | Injection confirmation |
| User ID format | IDOR enumeration |
| Debug endpoint | Environment variables or logs |

Report the chain, with the disclosure as the first step. That is how a low becomes
a high.

## The fix

- Return generic error messages and a correlation ID; log details server-side.
- Disable debug modes and profilers in production.
- Remove version headers at the edge.
- Do not publish source maps for internal code, or restrict them.
- Block access to VCS and backup paths at the web server.
- Review exports for field-level least privilege.

## Common mistakes

- Reporting every missing security header as a vulnerability.
- Claiming impact from a version banner without a matching CVE.
- Dumping a backup file instead of demonstrating access.
- Missing source maps because only HTML was reviewed.
- Ignoring the difference between "exists" and "forbidden" responses.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Header inspection | curl, Burp |
| Path checks | ffuf, custom loops |
| Source map review | browser DevTools, `source-map` tools |
| Chaining notes | Markdown |

## Practice lab

1. Provoke three different error responses and record what each leaks.
2. List every response header and mark which reveal infrastructure.
3. Check for a source map and inspect it for endpoints.
4. Test five common leftover paths.
5. Write a chain from a leaked internal hostname to an SSRF test.

## Further reading

- OWASP WSTG — Information gathering and error handling.
- OWASP Top 10 — A05 Security Misconfiguration.
- PortSwigger Academy — Information disclosure labs.
