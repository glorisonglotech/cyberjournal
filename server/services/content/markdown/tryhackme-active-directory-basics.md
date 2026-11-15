> [!NOTE]
> **Room notes.** Account names, credentials and flags are redacted; command output
> is illustrative. The room is conceptual and lab-based; complete the exercises on
> the provided domain.

## Executive summary

Active Directory Basics is a vocabulary room. It explains the structures that later
attack rooms assume: domains, organisational units, groups, Group Policy, Kerberos
and LDAP.

The write-up focuses on why each structure exists, because the attack paths in
intermediate rooms are consequences of those design decisions.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | Active Directory Basics |
| Difficulty | Intermediate |
| Operating system | Windows |
| Category | Active Directory |
| Skills | AD structure, Kerberos, GPO, LDAP |

## Objectives

- Describe the roles of domain controller, domain, OU and group.
- Explain the Kerberos ticket flow at a level sufficient for testing.
- Read Group Policy objects and understand their security impact.
- Enumerate users, groups and computers over LDAP or PowerShell.

## Tools used

| Tool | Purpose |
| --- | --- |
| PowerShell / RSAT | Native AD inspection |
| `ldapsearch` | Directory queries |
| BloodHound (optional) | Relationship visualisation |
| `rpcclient` | Anonymous and authenticated enumeration |

## Initial reconnaissance

On the provided Windows host:

```powershell
whoami /all
systeminfo | findstr /B /C:"Domain" /C:"OS Name"
nltest /dsgetdc:<domain>
```

On Linux against the domain controller:

```bash
nmap -Pn -sV -p 53,88,135,139,389,445,464,636,3268 <dc-ip>
```

A domain controller is identifiable by the combination of Kerberos (88), LDAP
(389/636) and SMB (445). Each becomes an enumeration channel.

## Enumeration

### Users and groups

```bash
ldapsearch -x -H ldap://<dc-ip> -b "dc=<domain>,dc=local" "(objectClass=user)" sAMAccountName
```

```powershell
Get-ADUser -Filter * -Properties MemberOf | Select Name,MemberOf
Get-ADGroupMember "Domain Admins"
```

Record group membership rather than individual users. Permissions in AD are granted
to groups, and nested groups are where privilege hides.

### Computers and OUs

```powershell
Get-ADComputer -Filter * | Select Name,OperatingSystem
Get-ADOrganizationalUnit -Filter *
```

OUs matter because Group Policy applies at OU level. A policy linked at the domain
root affects every machine.

### Group Policy

```powershell
Get-GPO -All | Select DisplayName,ModificationTime
gpresult /R
```

Look for policies that:

- Add users to local administrator groups.
- Deploy logon scripts from writable shares.
- Configure weak password or lockout settings.
- Set permissions on services.

## Vulnerability identification

The room does not require exploitation, but the design weaknesses it introduces are
the basis of later attacks:

| Design feature | Consequence |
| --- | --- |
| Broad local admin via GPO | One compromised host yields many |
| Service accounts with SPNs | Kerberoasting |
| Unconstrained delegation | Ticket capture |
| Writable SYSVOL scripts | Code execution as machines |
| Password reuse across tiers | Lateral movement |

## Kerberos in one page

```text
client -> AS-REQ -> KDC            (authenticate, receive TGT)
client -> TGS-REQ (TGT + SPN) -> KDC (receive service ticket)
client -> service (service ticket)
```

Three facts follow from this flow:

1. A TGT is cached; stealing it impersonates the user.
2. Service tickets are encrypted with the service account's key; weak passwords are
   crackable offline.
3. Delegation lets a service reuse a user's ticket, which is why it must be
   constrained.

## Exploitation

Not required in this room. If you want to rehearse, use the lab to:

- Enumerate with and without credentials.
- Request a service ticket for an SPN and inspect the encryption type.
- Identify which accounts are kerberoastable.

## Privilege escalation

Not applicable at the basics level. The relevant escalation concepts are introduced
here and practised in dedicated rooms:

- ACL abuse (GenericAll, WriteDACL).
- Kerberoasting and AS-REP roasting.
- Unconstrained and constrained delegation.
- DCSync rights.

## Flags and completion evidence

Answers are redacted. Record the queries that produced each answer; they are the
reusable part.

## Lessons learned

- AD is a permissions graph; groups are the edges.
- Group Policy is a privilege path as well as a configuration tool.
- Kerberos ticket properties explain most AD attack primitives.
- Enumeration with a low-privilege account is usually enough to find the path.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Broad local admin | Tiered administration, LAPS |
| Kerberoastable service accounts | Long random passwords, gMSA |
| Unconstrained delegation | Remove or constrain |
| Writable GPO scripts | Restrict SYSVOL permissions |
| Over-privileged groups | Regular access reviews |

## References

- TryHackMe — Active Directory Basics.
- Microsoft — Active Directory Domain Services documentation.
- MITRE ATT&CK — Credential Access techniques.
