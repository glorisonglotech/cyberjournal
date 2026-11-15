## The part nobody explains

A bug bounty programme is a queue with a business model attached. Understanding
the queue explains most of the frustration beginners experience: why a valid bug
is marked duplicate, why severity feels arbitrary, and why a detailed report can
sit untouched for a week.

## Learning objectives

- Describe the lifecycle of a report from submission to payout.
- Read a programme's policy and predict how it will be triaged.
- Estimate severity the way a triager does, not the way a scanner does.
- Handle duplicates, disagreements and scope questions professionally.

## Prerequisites

- A platform account.
- One or two disclosed reports read end to end.
- Familiarity with CVSS base metrics.

## The report lifecycle

```text
submit -> triage -> validation -> severity -> duplicate check -> bounty -> disclosure
             |            |            |
             +-- needs info +-- not reproducible
```

Each stage has a different reader:

| Stage | Reader | What they need |
| --- | --- | --- |
| Triage | Programme coordinator | Clear steps, clear scope |
| Validation | Security engineer | A request they can replay |
| Severity | Programme owner | Business impact, not payload |
| Duplicate check | Internal tracker | The specific endpoint and parameter |

Write for the busiest reader first. If the first screen of your report does not
state the endpoint, the impact and the reproduction, you have made triage harder.

## Severity is a business calculation

CVSS gives you a number. Programmes adjust it with context you may not see:
whether the affected tenant is a paying customer, whether the data is regulated,
whether exploitation requires an account, and whether the bug is already known
internally.

A useful approximation:

| Finding | Typical rating | Why |
| --- | --- | --- |
| IDOR on your own invoice only | Low | No cross-user impact |
| IDOR exposing other users' PII | High | Confidentiality across tenants |
| Stored XSS in an admin-only panel | Medium | Requires privileged victim |
| Stored XSS in a public comment | High | Any visitor is a victim |
| SSRF with cloud metadata read | Critical | Credential exposure |
| Missing rate limit on login | Informational | Only matters with weak passwords |

> [!IMPORTANT]
> Never inflate severity to negotiate. A triager who downgrades one report reads
> the next one more sceptically.

## Reading a policy properly

Policies differ in ways that change your testing:

- **Safe harbour wording.** Some programmes grant legal protection only for
  listed techniques.
- **Automated scanning rules.** Many allow it with rate limits; some forbid it.
- **Data handling.** Most forbid accessing real user data beyond the minimum
  needed to prove impact. Screenshot one record, not a table.
- **Out-of-scope classes.** Self-XSS, missing security headers, and clickjacking
  on non-sensitive pages are commonly excluded.
- **Disclosure terms.** Some allow public write-ups after a fixed period; others
  require permission.

If a policy is ambiguous, ask in the programme's public channel or via the
submission form before testing. A question costs a day; a ban costs the programme.

## Duplicates

Duplicates are not a judgement on your skill. They are a signal that the
endpoint is well-tested. Two practical responses:

1. **Differentiate.** If your report shows a distinct impact path (for example,
   the same IDOR but reachable unauthenticated), say so explicitly in the first
   paragraph.
2. **Move upstream.** If an endpoint is saturated, test the features around it:
   exports, integrations, admin tooling, mobile APIs, and older API versions.

## When triage disagrees

Respond with evidence, not argument:

- Restate the impact in one sentence.
- Provide the exact request and response that demonstrates it.
- Ask a specific question: "Is the `tenant_id` parameter considered
  user-controlled in this endpoint?"
- Accept a scope ruling once it is given. Escalation is for process failures,
  not for disagreements about severity.

## Payment mechanics

Most programmes pay on a schedule after validation, not at submission. Factors
that delay payment: missing tax information, unresolved duplicate disputes, and
reports that need a fix deployed before closure.

Keep your payout profile complete before you need it. A validated critical that
cannot be paid is a support ticket.

## Common mistakes

- Submitting a scanner output with no manual confirmation.
- Describing impact you did not observe.
- Testing an asset that resolves to a third party.
- Arguing severity in the report body instead of stating impact once.
- Forgetting that a "won't fix" is still useful information about the programme.

## Practice lab

1. Choose a programme with disclosed reports.
2. Read five reports and classify each by the severity table above.
3. Compare your classification with the actual awarded severity.
4. Rewrite the weakest report's summary so the endpoint, impact and reproduction
   appear in the first three lines.

## Further reading

- HackerOne — programme policy templates and disclosure guidelines.
- Bugcrowd — Vulnerability Rating Taxonomy (VRT), a useful second opinion on severity.
- FIRST — CVSS v3.1 specification.
- OWASP — Vulnerability disclosure cheat sheet.
