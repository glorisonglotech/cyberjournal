## The sitemap is a marketing document

Content discovery finds the parts of an application that the navigation does not
link: backups, version control remnants, admin panels, debug routes, old APIs and
upload directories.

A wordlist is necessary but not sufficient. What separates a productive run from
a noisy one is knowing which classes of file you are looking for and how the
server responds when they exist.

## Learning objectives

- Choose wordlists by target type rather than by size.
- Distinguish "not found" from "not authorised" from "soft 404".
- Find backups, VCS metadata, configuration files and administrative surfaces.
- Recurse without drowning in results.

## Prerequisites

- ffuf or feroxbuster, plus SecLists.
- A baseline request to compare against.
- Permission to fuzz (check rate limits in the policy).

## Start with a baseline

Before fuzzing, request a path that certainly does not exist and record the
response: status, length, and body marker.

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://target.example/this-path-is-random-9182
```

If that returns `200` with a full page, the application has a soft 404 and you
must filter by size or content, not status code.

## Choose the wordlist by shape

| Target | Wordlist | Reason |
| --- | --- | --- |
| Web root | `raft-medium-directories.txt` | Balanced directory coverage |
| API | `api-endpoints.txt`, `raft-small-words.txt` | Short, versioned paths |
| Backup files | `raft-small-extensions.txt` + custom list | Extension guessing |
| CMS | CMS-specific lists (WordPress, Drupal) | Known paths matter more |
| Parameters | `burp-parameter-names.txt` | Different problem, same tool |

Bigger is not better. A 200,000-word list at 20 requests per second takes three
hours and will find the same ten files as a targeted 5,000-word list.

## The high-value classes

### Backups and editor artefacts

```text
index.php.bak
index.php~
www.zip
backup.tar.gz
db.sql
.env
.env.local
config.php.old
```

These are worth a dedicated extension pass:

```bash
ffuf -u https://target.example/FUZZ \
  -w raft-small-words.txt \
  -e .bak,.old,.zip,.tar.gz,.sql,.env,.json \
  -mc 200,301,302,403 \
  -of json -o backup-scan.json
```

### Version control remnants

```bash
for path in .git/HEAD .git/config .svn/entries .hg/requires; do
  printf '%s ' "$path"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example/$path"
done
```

A readable `.git/HEAD` means the repository may be reconstructable. Report it;
do not dump the whole repository.

### Administrative surfaces

Look for login panels and internal tooling:

```bash
ffuf -u https://target.example/FUZZ \
  -w admin-panels.txt \
  -mc 200,401,403 \
  -fr 'not found|404'
```

A 401 or 403 here is a finding worth pursuing, not a dead end: it confirms the
path exists.

### Debug and metadata

```bash
for path in server-status actuator/env .well-known/security.txt robots.txt sitemap.xml; do
  printf '%s ' "$path"
  curl -s -o /dev/null -w '%{http_code}\n' "https://target.example/$path"
done
```

## Filtering properly

ffuf filters are the difference between a readable run and a wall of noise:

```bash
ffuf -u https://target.example/FUZZ \
  -w wordlist.txt \
  -mc 200,204,301,302,307,401,403 \
  -fs 1240 \
  -rate 40 \
  -t 20
```

- `-fs` filters by response size (your soft-404 baseline).
- `-fr` filters with a regex on the body.
- `-fc` removes specific status codes.

Record the baseline size in your notes so the run is reproducible.

## Recursion with a budget

Recursing finds nested admin areas; it also multiplies requests. Cap depth and
use a smaller list at deeper levels.

```bash
feroxbuster -u https://target.example \
  --depth 2 \
  --rate-limit 30 \
  -w raft-medium-directories.txt \
  -x php,js,json
```

> [!NOTE]
> Many programmes cap automated requests per second. A programme that allows
> fuzzing at 10 req/s is not allowing 10,000 req/s because your tool defaults
> higher.

## What to do with a hit

For each interesting response, ask three questions:

1. Does it require authentication? Try unauthenticated, then with the lowest
   privilege account you have.
2. Does it expose data or functionality, or only a blank page?
3. Is it in scope and within the policy's data-handling rules?

Screenshot the minimal evidence: the URL, the status, and the first few bytes of
content that prove exposure. Do not download a database backup; demonstrate that
it is retrievable.

## Common mistakes

- Fuzzing without a baseline, then treating soft 404s as hits.
- Using a 200k-word list against a scope that forbids heavy automation.
- Reporting a backup file without checking whether it contains real data.
- Missing `.git` because only directory lists were used.
- Forgetting that a 403 is evidence: the route exists and is protected.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Directory and file fuzzing | ffuf, feroxbuster, gobuster |
| Wordlists | SecLists |
| VCS recovery | git-dumper (only with permission) |
| Baseline checks | curl |

## Practice lab

1. On a lab target, capture the soft-404 baseline.
2. Run a directory scan with a small list, then with a medium list. Compare hits.
3. Run a dedicated backup-extension pass and verify one finding manually.
4. Check for `.git/HEAD` and explain what its status code means.
5. Write a five-line finding note for the most interesting result.

## Further reading

- OWASP WSTG — Review webserver metafiles and content discovery.
- SecLists documentation — wordlist categories.
- ffuf wiki — matchers, filters and rate control.
