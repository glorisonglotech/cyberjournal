> [!NOTE]
> **Room notes.** Answers and alert identifiers are redacted; log excerpts are
> illustrative. The value of this room is the triage loop, not the individual
> questions.

## Executive summary

SOC Fundamentals introduces defensive work from the analyst's seat: what telemetry
exists, how an alert reaches a queue, and how an investigation is documented.

For offensive testers, the room is a useful mirror. Every finding you report either
produces an alert or it does not, and that difference determines how quickly the
organisation can respond.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | SOC Fundamentals |
| Difficulty | Beginner |
| Operating system | Cross-platform |
| Category | SOC, defensive security |
| Skills | Alert triage, log analysis, detection reasoning |

## Objectives

- Describe the SOC roles and the path from telemetry to alert.
- Triage an alert using a consistent method.
- Read common log sources: authentication, process, network.
- Write an investigation note that another analyst can follow.

## Tools used

| Tool | Purpose |
| --- | --- |
| SIEM interface | Alert review |
| Wireshark | Packet-level inspection |
| Sysmon / Windows Event Viewer | Process and authentication telemetry |
| MITRE ATT&CK | Technique mapping |

## Initial reconnaissance

In a SOC, "reconnaissance" means establishing context before touching the alert:

| Question | Source |
| --- | --- |
| What is the asset? | Asset inventory, CMDB |
| Who normally uses it? | Identity data |
| Is it internet-facing? | Network map |
| What is normal for this host? | Baselines, historical alerts |
| Is there a change record? | Ticketing system |

An alert without context generates false positives. Context is the analyst's main
advantage over an automated rule.

## Enumeration

### Log sources

| Source | What it answers |
| --- | --- |
| Authentication logs | Who logged in, from where, with what result |
| Process creation | What executed and with which parent |
| Network flows | Which hosts talked, on which ports, how much |
| DNS queries | What was resolved, including rare domains |
| File integrity | What changed on disk |
| Cloud audit logs | Which API calls were made by whom |

### Building a timeline

```text
14:02:11  login success  user=svc_backup  src=10.0.4.21
14:02:40  process start  cmd=powershell.exe -enc <blob>  parent=winword.exe
14:03:05  network        dst=203.0.113.10:443  bytes_out=182k
```

The parent-child relationship in the second line is the finding. `powershell.exe`
launched by `winword.exe` is abnormal in almost every environment.

## Alert triage

A four-step loop:

1. **Validate.** Is the alert real or a known benign pattern?
2. **Scope.** Which hosts, accounts and data are involved?
3. **Contain.** What action limits damage without destroying evidence?
4. **Document.** What did you check, what did you conclude, what did you do?

```text
Alert:  Suspicious encoded PowerShell
Verdict: True positive
Scope:  Host FIN-07, user j.adeyemi, outbound to 203.0.113.10
Action: Host isolated, credentials reset, sample submitted
Notes:  Parent process winword.exe; macro-enabled document from email
```

## Vulnerability identification

In defensive terms, "vulnerability" is a detection gap:

- No alert for a technique you know is used.
- An alert with no context, generating fatigue.
- Telemetry missing from a critical host.
- A rule that fires only after the damage is done.

Map these against ATT&CK to see which techniques are invisible.

## Exploitation

Not applicable. The equivalent exercise is simulating a technique in a lab and
checking whether it produces an alert with enough context to investigate.

## Privilege escalation

Not applicable in a defensive room, though the mirror question is useful: would you
detect privilege escalation? Which event IDs, which process ancestry, which
authentication patterns?

## Flags and completion evidence

Answers are redacted. Record the log line that supported each conclusion; that is
the transferable artefact.

## Lessons learned

- Alerts are hypotheses; context decides the verdict.
- Parent-child process relationships are the highest-value signal in endpoint logs.
- Time synchronisation across sources is a prerequisite for timelines.
- Detection quality depends on telemetry coverage, not on rule count.
- Documentation is part of the investigation, not an afterthought.

## Mitigation and remediation

| Gap | Control |
| --- | --- |
| No process telemetry | Deploy Sysmon with a reviewed configuration |
| Alert fatigue | Tune rules, add context, measure false-positive rate |
| No asset context | Maintain an inventory linked to identity data |
| Slow containment | Pre-approved isolation playbooks |

## References

- TryHackMe — SOC Fundamentals.
- MITRE ATT&CK — technique and detection mapping.
- Microsoft — Sysmon documentation.
- NIST SP 800-61 — incident handling guide.
