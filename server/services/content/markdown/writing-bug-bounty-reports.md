## The report is the deliverable

A finding that cannot be reproduced by a triager is, operationally, not a finding.
Report quality determines both payout and how quickly the next report is read.

## Learning objectives

- Structure a report so triage can act on the first screen.
- Write reproducible steps without narrating your exploration.
- State impact in the programme's terms.
- Handle follow-up questions without weakening the finding.

## Prerequisites

- A validated finding with captured requests.
- The programme's severity taxonomy.
- A Markdown editor.

## Structure that works

```text
1. Title            — endpoint + vulnerability class
2. Summary          — three sentences: where, what, impact
3. Severity         — your rating and a one-line justification
4. Affected asset   — exact host, path, parameter
5. Preconditions    — accounts, roles, configuration
6. Steps to reproduce
7. Evidence         — request, response, screenshot
8. Impact           — what an attacker gains
9. Remediation      — the control that removes the class
10. References      — standards, not blog posts
```

Ten sections sounds like a lot. Most fit on two screens.

## The title

Bad: "IDOR vulnerability in API"
Good: "IDOR in GET /api/v1/invoices/{id} exposes other tenants' invoices"

The title is what appears in the triage queue. Make it searchable and specific.

## The summary

Three sentences, in this order:

1. What the endpoint does and who can reach it.
2. What the flaw lets you change or read.
3. What the consequence is for the business.

```text
The invoice PDF endpoint authorises by invoice ID only. An authenticated user can
request any other user's invoice by changing the numeric identifier. This exposes
billing addresses, line items and partial card data across tenants.
```

No payloads in the summary. Payloads live in the reproduction.

## Steps to reproduce

Numbered, deterministic, minimal:

```text
1. Sign in as user A (a@example.com) and open invoice 4821.
2. Capture the request: GET /api/v1/invoices/4821/download
3. Sign in as user B in a second browser profile.
4. Replay the captured request with B's session cookie.
5. Observe the 200 response containing A's billing address and invoice total.
```

Delete everything that did not matter: the recon commands, the failed attempts,
the tool output. The reader wants the shortest path to the behaviour.

## Evidence

| Evidence | Include | Avoid |
| --- | --- | --- |
| Request | Method, path, relevant headers | Full cookie jar |
| Response | Status and the proving fields | Entire user table |
| Screenshot | Redacted, annotated | Unredacted PII |
| Recording | Short, silent | Long scrolling capture |

Redact consistently. If the report needs the identifier, show the shape
(`4821`) but not the victim's name.

## Impact

Write impact for two readers:

- **Engineer:** "Any authenticated user can read any invoice."
- **Business:** "Customer billing data for all tenants is exposed; this is a
  reportable data breach under the programme's terms."

Avoid "could potentially". Either it happens or it does not.

## Remediation

One paragraph, class-level:

> Enforce ownership in the query (`WHERE id = ? AND owner_id = ?`) and return 404
> for objects the caller does not own. Add an authorisation test to the endpoint's
> integration suite.

Do not paste a full patch unless asked. Do offer to verify the fix.

## Handling follow-up

| Question | Answer shape |
| --- | --- |
| "Can you reproduce?" | Steps 1–5, plus a fresh recording |
| "Is this in scope?" | Quote the clause |
| "Lower severity?" | Restate impact once; accept the ruling |
| "Duplicate?" | Name the distinguishing factor |
| "Any other data?" | "That is all I accessed." |

## Common mistakes

- Burying the endpoint below three paragraphs of context.
- Including scanner output instead of a manual reproduction.
- Screenshots of the browser UI where a raw request is needed.
- Overstating severity in the title.
- Forgetting to redact tokens and personal data.
- Arguing after a scope ruling.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Drafting | Markdown |
| Request capture | Burp Suite, curl |
| Redaction | image editor, text replacement |
| Recording | short screen capture |

## Practice lab

1. Take a previous note and rewrite it into the ten-section structure.
2. Cut the reproduction to five steps or fewer.
3. Write the summary in exactly three sentences.
4. Redact every identifier and token in the evidence.
5. Ask a peer to reproduce from the report alone, without your help.

## Further reading

- HackerOne — report writing guidance and disclosed report examples.
- Bugcrowd — submission best practices.
- OWASP — vulnerability reporting guidance.
