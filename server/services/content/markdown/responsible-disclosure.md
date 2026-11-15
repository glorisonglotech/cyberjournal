## You found it; now what

Disclosure is a process with legal, ethical and practical dimensions. Handled
well, it protects users and your reputation. Handled badly, it creates risk for
everyone including you.

## Learning objectives

- Report a vulnerability outside a bounty programme safely.
- Set and communicate a disclosure timeline.
- Escalate when a vendor does not respond.
- Publish a write-up without enabling abuse.

## Prerequisites

- A validated finding on a system you were authorised to test, or a
  vulnerability you discovered accidentally.
- The organisation's security contact.

## Step 1 — Stop testing

Once you have proof, stop. Do not enumerate further, do not access more data, and
do not try "just one more thing" to raise severity. Continued access weakens your
position and can breach computer-misuse law.

Preserve only the minimum evidence: the request, the response, and a timestamp.

## Step 2 — Find the right channel

| Channel | When to use |
| --- | --- |
| `security.txt` | First choice — the organisation publishes it |
| Security email | Standard fallback |
| Bug bounty platform | If a programme exists, use it |
| Support / contact form | Last resort; ask for the security team |
| National CERT | When the vendor is unresponsive or the risk is critical |

```bash
curl -s https://example.com/.well-known/security.txt
```

Encrypt sensitive details with the published PGP key if one exists. Never send
credentials, full database dumps or other users' personal data.

## Step 3 — Write the initial report

Keep it short and actionable:

```text
Subject: Vulnerability report — unauthenticated SQL injection on reports.example.com

Summary: The /reports/search endpoint concatenates the `q` parameter into a SQL
query. A boolean payload changes the response, and a time-based payload confirms
execution.

Impact: An unauthenticated attacker can read the reports database.

Evidence: attached request/response pair and timestamps.

I am reporting privately and will not publish before <date>. Please confirm
receipt and let me know your remediation timeline.
```

State what you did, when, and what you will do next. That framing is what
separates research from an incident.

## Step 4 — Agree a timeline

Industry norms:

| Stage | Typical duration |
| --- | --- |
| Acknowledgement | 3 business days |
| Triage and validation | 10 business days |
| Fix for critical issues | 30 days |
| Fix for moderate issues | 90 days |
| Public disclosure | 90 days after report |

Ask for a date rather than imposing one. If the vendor needs longer, agree in
writing. If they go silent, follow up twice, then escalate.

## Step 5 — Escalate

Order of escalation:

1. Follow up on the original thread.
2. Contact a second published channel (security@ and a named person if available).
3. Contact the national CERT or the platform's mediation team.
4. As a last resort, publish with a clear account of the attempts made.

Never escalate by demonstrating impact on production data.

## Step 6 — CVE assignment

For widely used software, request a CVE through a CNA (the vendor, if they are
one) or MITRE. Include: affected versions, vulnerability type, root cause, and a
reference. The vendor usually writes the advisory; offer your technical detail.

## Step 7 — Publishing a write-up

Publish only after the fix or the agreed date. Then:

- Remove live payloads that would work against unpatched systems.
- Redact hostnames, tokens and user data.
- Describe the root cause and the fix, not just the exploit.
- Credit the vendor's response accurately.
- Note the disclosure timeline.

> [!IMPORTANT]
> "Fully disclosed" is not the same as "irresponsible". A write-up that explains
> the class and the remediation helps defenders; one that functions as a working
> exploit against unpatched systems does not.

## Legal context

Authorisation is what distinguishes research from unauthorised access. Bounty
scope, a signed engagement letter, or a lab you own are authorisations. Curiosity
is not.

If you find something accidentally, stop, report privately, and do not retain
data. Document your actions from the first request.

## Common mistakes

- Continuing to test after confirming the bug.
- Sending a full database extract as "proof".
- Setting an aggressive deadline without attempting contact.
- Publishing before the fix when users remain exposed.
- Naming individuals rather than the organisation in public write-ups.

## Toolbox

| Purpose | Tool |
| --- | --- |
| Contact discovery | security.txt, WHOIS, CERT lists |
| Encryption | GnuPG |
| Timeline tracking | calendar reminders |
| CVE request | MITRE CVE form, vendor CNA |

## Practice lab

1. Find the security.txt for three organisations and compare their policies.
2. Draft an initial disclosure email for a lab finding.
3. Set a 90-day timeline and list the follow-up dates.
4. Write a public-facing summary that omits exploit detail.
5. Identify which national CERT applies to your jurisdiction.

## Further reading

- ISO/IEC 29147 — vulnerability disclosure.
- ISO/IEC 30111 — vulnerability handling processes.
- CISA — coordinated vulnerability disclosure guidance.
- securitytxt.org — publishing a security contact.
