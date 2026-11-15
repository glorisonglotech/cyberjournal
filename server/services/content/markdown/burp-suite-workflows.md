## From proxy to instrument

Once scope and interception are configured, Burp becomes a testing instrument:
Repeater for hypothesis testing, Intruder for controlled variation, and extensions
for the checks you would otherwise repeat by hand.

## Learning objectives

- Organise Repeater tabs and evidence for a long engagement.
- Choose the right Intruder attack type for the question.
- Use match-and-replace to test header-dependent behaviour.
- Select extensions that add value without adding noise.

## Prerequisites

- Burp Suite with scope configured.
- A lab target with authentication and at least one parameterised endpoint.

## Repeater as a lab notebook

Rules that keep Repeater useful after six hours:

1. **One tab per hypothesis**, renamed: `F-02-idor-invoice`.
2. **Keep a pristine copy** of the original request.
3. **Change one variable per send.**
4. **Annotate the response** with a comment when it changes.
5. **Save the decisive response** to disk.

Right-click → "Send to Repeater" from any proxy history item keeps the original
request intact.

## Intruder attack types

| Type | Question it answers |
| --- | --- |
| Sniper | One payload set, one position at a time |
| Battering ram | Same payload in all positions |
| Pitchfork | Parallel lists, one value each |
| Cluster bomb | Every combination of lists |

Examples:

- **Sniper:** enumerate numeric IDs to find a valid one.
- **Pitchfork:** pair a list of usernames with their known passwords.
- **Cluster bomb:** test every combination of `role` and `plan` values.

Intruder in Community edition is throttled. For volume work, export the request
and use ffuf, then replay interesting results in Repeater.

## Payload processing

Useful for access-control and parser tests:

| Processor | Use |
| --- | --- |
| Add prefix/suffix | Wrap a path segment |
| Hash | Test predictable tokens |
| URL-encode | Test encoded routing |
| Skip if | Filter known responses |

```text
Payload: 100..200
Processing: add prefix "/api/users/"
```

## Match and replace

Proxy → Options → Match and replace. Practical rules:

| Rule | Purpose |
| --- | --- |
| `X-Forwarded-For: .*` → `127.0.0.1` | Trusted IP checks |
| `User-Agent: .*` → mobile UA | Mobile-only routes |
| `Content-Type: .*` → `application/json` | Parser differences |
| Response `Content-Security-Policy: .*` → empty | XSS impact testing |

Disable rules after use. A forgotten rule contaminates evidence.

## Extensions worth installing

| Extension | Purpose |
| --- | --- |
| Autorize | Automated authorisation checks across sessions |
| Param Miner | Hidden parameter discovery |
| Logger++ | Searchable request log |
| Turbo Intruder | High-speed, scriptable requests |
| JWT Editor | Token inspection and mutation |

Install few, understand each. An extension you cannot explain is a source of false
positives.

## Organising an engagement

```text
engagement/
├── notes.md
├── requests/          # saved raw requests
├── responses/         # decisive responses
├── findings/          # F-01-*.md
└── scope.txt
```

Export requests with right-click → "Copy to file". Keep the session's cookies out
of committed notes.

## Comparing responses

Burp Comparer highlights differences between two responses. Use it to:

- Confirm a boolean condition changed.
- Spot a hidden field in one role's response.
- Detect a size difference after a header change.

For large bodies, diff in the terminal:

```bash
diff <(jq -S . a.json) <(jq -S . b.json)
```

## Common mistakes

- Twenty unnamed Repeater tabs and no idea which one had the finding.
- Using Cluster bomb when Sniper answers the question.
- Leaving match-and-replace rules enabled.
- Trusting Intruder's throttled timing for rate-limit conclusions.
- Installing extensions that generate findings you cannot verify.

## Toolbox

| Need | Tool |
| --- | --- |
| Hypothesis testing | Repeater |
| Controlled variation | Intruder |
| Header behaviour | Match and replace |
| Comparison | Comparer |
| Authorisation sweeps | Autorize |

## Practice lab

1. Rename and annotate three Repeater tabs during a test.
2. Use Sniper to enumerate ten IDs and identify a valid one.
3. Configure a match-and-replace rule, test a trusted-IP check, then disable it.
4. Use Comparer on two role responses to find a hidden field.
5. Export the decisive request for a finding.

## Further reading

- PortSwigger — Burp Suite documentation.
- PortSwigger Academy — Burp Intruder and Repeater labs.
- turbo-intruder documentation.
