## Sample content notice

> [!NOTE]
> This is **sample editorial content** shipped with Glorison Cyber Journal to demonstrate the news and analysis format. It is not reporting on a real incident, and it references no specific CVE record. The scoring discussion is accurate and follows the FIRST CVSS v3.1 specification.

## Summary

Two teams score the same vulnerability 9.8 and 6.5, then spend a meeting arguing about who is wrong. Usually neither is: they are scoring different systems, and only one of them is reading the vector string.

The base score is a property of the vulnerability. The **environmental** score is a property of your exposure. Prioritisation needs the second one.

## Where the argument comes from

A CVSS v3.1 vector looks like this:

```text
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
```

Each metric is a decision, and each decision moves the score:

| Metric | Value | Meaning |
| --- | --- | --- |
| AV | N | Reachable over the network |
| AC | L | No special conditions to exploit |
| PR | N | No privileges required |
| UI | N | No user interaction |
| S | U | Impact stays within the vulnerable component |
| C / I / A | H / H / H | Total loss of confidentiality, integrity, availability |

That combination is 9.8 — the maximum for a network-facing unauthenticated issue. It is also the *default* score assigned to a lot of published CVEs, whether or not the vulnerable component is reachable.

## The metric teams disagree about

`PR` (privileges required) causes most of the real-world divergence. An issue that is critical system-wide may require an authenticated account, which changes `PR:N` to `PR:L` and pulls a 9.8 down to 8.8.

`AC` is the next one. `AC:H` exists for attacks with a race condition, a non-default configuration, or a dependency on timing. A high base score with `AC:H` is a real vulnerability with an unreliable exploit — different operational urgency.

```text
CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H   → 8.1
CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H   → 7.8
```

Same impact metrics, very different exposure.

## Environmental metrics are the ones you control

The environmental group lets you re-score the vulnerability **for your deployment**:

```text
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:P/RL:O/RC:C/CR:H/IR:H/AR:M
```

| Metric | Value | Why |
| --- | --- | --- |
| E (Exploit code maturity) | P — proof of concept | No weaponised exploit observed |
| RL (Remediation level) | O — official fix | Vendor patch available |
| RC (Report confidence) | C — confirmed | Reproducible |
| CR / IR / AR | H / H / M | Availability matters less than data integrity here |

Environmental scoring is where a 9.8 becomes a 7.4 for an internal-only service behind SSO — or stays a 9.8 because the service is internet-facing and holds regulated data. Both answers are defensible; the vector documents which assumption produced it.

> [!TIP]
> Record the vector and the reasoning next to the ticket. "High, because CVSS says so" is not a prioritisation decision anyone can audit later.

## What the score does not measure

- **Business context.** A 9.8 in a decommissioned staging environment outranks nothing.
- **Exploit availability.** Check CISA KEV or equivalent before trusting a base score alone.
- **Compensating controls.** WAF rules, network segmentation and monitoring change practical risk without changing the vector.
- **Asset criticality.** CVSS has no concept of "this database is the company".

A workable prioritisation combines four inputs:

1. Base score (severity of the flaw)
2. Known exploitation in the wild (KEV, vendor advisories)
3. Reachability from an untrusted network
4. Asset criticality and data classification

## Practical triage order

| Priority | Condition |
| --- | --- |
| Now | Internet-facing, known exploited, no compensating control |
| This sprint | Internet-facing, high base score, exploit code public |
| Planned | Internal, authenticated, high impact |
| Monitor | Requires local access or non-default configuration |

## Lessons Learned

- Read the **vector**, not the number. The number is a summary; the vector is the argument.
- Base score is a starting point; environmental score is the decision.
- Document assumptions at the time of triage — they are the audit trail.
- A prioritisation model that never says "later" is not a model.

## References

- FIRST — Common Vulnerability Scoring System v3.1: Specification Document
- FIRST — CVSS v3.1 User Guide, environmental metric guidance
- CISA — Known Exploited Vulnerabilities catalog
