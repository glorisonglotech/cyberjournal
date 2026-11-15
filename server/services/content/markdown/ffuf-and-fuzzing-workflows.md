## One tool, four questions

FFUF fuzzes any position you can mark with `FUZZ`. That makes it useful for
directories, parameters, values, virtual hosts and request bodies — provided you
build filters that keep the output readable.

## Learning objectives

- Configure matchers and filters for a clean result set.
- Fuzz directories, parameters, values and virtual hosts.
- Save and reuse runs so findings are reproducible.
- Control rate to stay inside programme limits.

## Prerequisites

- ffuf installed.
- SecLists wordlists.
- A baseline response for the target.

## Step 1 — Baseline and filters

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
  https://target.example/does-not-exist-9182
```

```bash
ffuf -u https://target.example/FUZZ \
  -w wordlist.txt \
  -mc 200,204,301,302,401,403 \
  -fs 1240 \
  -rate 40
```

| Flag | Purpose |
| --- | --- |
| `-mc` | Match status codes |
| `-fc` | Filter status codes |
| `-fs` | Filter response size |
| `-fw` | Filter word count |
| `-fr` | Filter body regex |
| `-rate` | Requests per second |
| `-t` | Concurrency |

## Step 2 — Directories and files

```bash
ffuf -u https://target.example/FUZZ \
  -w raft-medium-directories.txt \
  -e .php,.bak,.zip,.json \
  -mc 200,301,302,401,403 \
  -rate 30 \
  -of json -o dirs.json
```

JSON output matters: it preserves size, words and status for later comparison, and
it is evidence you can reproduce.

## Step 3 — Parameters

Discover hidden query parameters:

```bash
ffuf -u 'https://target.example/api/search?FUZZ=test' \
  -w burp-parameter-names.txt \
  -mc all \
  -fs 812 \
  -rate 30
```

A different response size or status for one parameter name means the server treats
it differently. That is a lead, not a finding.

## Step 4 — Values

Once a parameter exists, fuzz its value:

```bash
ffuf -u 'https://target.example/api/users?id=FUZZ' \
  -w ids.txt \
  -mc 200 \
  -fr 'not found' \
  -rate 20
```

For authorisation testing, keep the session fixed and vary the ID; a 200 with data
for an ID you do not own is the finding.

## Step 5 — Virtual hosts

```bash
ffuf -u https://target.example/ \
  -H 'Host: FUZZ.target.example' \
  -w vhosts.txt \
  -fs 1240 \
  -rate 20
```

Filter by size because vhosts often return the same default page.

## Step 6 — POST bodies

```bash
ffuf -u https://target.example/api/login \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"FUZZ","password":"test"}' \
  -w users.txt \
  -mc all \
  -fs 96 \
  -rate 10
```

This is how user enumeration is measured at scale. Keep the rate low; login
endpoints are monitored.

## Step 7 — Reproducibility

```bash
ffuf ... -of json -o run-2026-11-15.json
```

Record in your notes:

```text
run: dirs.json
target: https://target.example
wordlist: raft-medium-directories.txt (20469 lines)
filters: -mc 200,301,302,401,403 -fs 1240
rate: 30/s
result: /admin (403), /backup.zip (200)
```

The next person — including future you — can rerun it.

## Common mistakes

- Fuzzing without a baseline, then chasing soft 404s.
- Using default concurrency against a rate-limited scope.
- Forgetting `-fs` on a site that returns 200 for everything.
- Treating a parameter-name hit as a vulnerability.
- Losing output files, so the finding cannot be reproduced.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Fuzzing | ffuf |
| Wordlists | SecLists |
| JSON inspection | jq |
| Baseline | curl |

## Practice lab

1. Capture a baseline and run a directory scan with filters.
2. Discover one hidden parameter with a parameter wordlist.
3. Fuzz an ID parameter with two sessions and compare results.
4. Test three virtual host names on a lab IP.
5. Save the run configuration in your notes.

## Further reading

- ffuf wiki — matchers, filters, output formats.
- SecLists — wordlist selection.
- OWASP WSTG — content discovery and parameter testing.
