## Two tools, one workflow

Gobuster is fast and predictable. Feroxbuster adds recursion and better filtering
for web applications. Use Gobuster for a quick pass and Feroxbuster when you need
to explore structure.

## Learning objectives

- Select wordlists appropriate to the target.
- Filter soft 404s and wildcard responses.
- Recurse without exceeding the agreed request rate.
- Turn results into test hypotheses.

## Prerequisites

- gobuster and feroxbuster installed.
- SecLists wordlists.
- A baseline response for the target.

## Step 1 — Baseline

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
  https://target.example/random-not-found-9182
```

Record the status and size. Every tool filter depends on this baseline.

## Step 2 — Quick pass with Gobuster

```bash
gobuster dir \
  -u https://target.example \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -t 20 \
  -x php,html,js,json \
  --exclude-length 1240 \
  -o gobuster-root.txt
```

| Flag | Purpose |
| --- | --- |
| `-t` | Threads; lower it on rate-limited scopes |
| `-x` | Extensions to append |
| `--exclude-length` | Drop soft 404s |
| `-k` | Ignore TLS errors (labs only) |
| `-r` | Follow redirects (use with care) |

## Step 3 — Structure discovery with Feroxbuster

```bash
feroxbuster \
  -u https://target.example \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  --depth 2 \
  --rate-limit 40 \
  -x php,js,json \
  --filter-status 404 \
  --filter-size 1240 \
  -o ferox.txt
```

Feroxbuster auto-filters wildcard responses in most cases. Check the first lines of
output to confirm it detected the baseline.

## Step 4 — Wordlist choice

| Target | List | Reason |
| --- | --- | --- |
| Marketing site | `raft-small-directories.txt` | Few routes |
| Web application | `raft-medium-directories.txt` | Balance |
| API | `api-endpoints.txt` | Versioned paths |
| CMS | CMS-specific | Known route names |
| Backups | `raft-small-extensions` + custom | Extension guessing |

Start small. A 20,000-word list on a scope that allows 10 requests per second takes
over half an hour and rarely beats a targeted 5,000-word run.

## Step 5 — Reading results

| Result | Meaning | Next step |
| --- | --- | --- |
| 200 | Accessible | Request it with a browser |
| 301/302 | Redirect | Follow manually; destination matters |
| 401 | Auth required | Try default creds only if permitted |
| 403 | Exists, forbidden | Try alternate paths, methods, headers |
| 500 | Server error | Input handling may be broken |
| 200, same size | Soft 404 | Filter it out |

A 403 is a hit. Many testers skip them and miss the admin panel.

## Step 6 — Recurse deliberately

Recursion multiplies requests. Cap depth and use a smaller list at depth:

```bash
feroxbuster -u https://target.example/api \
  --depth 1 \
  --rate-limit 30 \
  -w api-endpoints.txt
```

Then stop and test what you found. Enumeration without testing is just a bigger
wordlist.

## Common mistakes

- Running large lists at default thread counts on rate-limited scopes.
- Not setting an exclusion for the soft-404 baseline.
- Ignoring 401/403 responses.
- Recursing five levels deep on a small application.
- Forgetting to save output, then being unable to reproduce the finding.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Directory enumeration | gobuster, feroxbuster |
| Wordlists | SecLists |
| Baseline | curl |
| Post-processing | grep, sort, awk |

## Practice lab

1. Capture the soft-404 baseline for a lab host.
2. Run a small Gobuster pass and record all non-404 statuses.
3. Run Feroxbuster with recursion disabled and compare coverage.
4. Test one 403 response with a different method and path case.
5. Write three hypotheses from the discovered routes.

## Further reading

- Gobuster documentation.
- Feroxbuster documentation.
- SecLists categories and wordlist selection guidance.
