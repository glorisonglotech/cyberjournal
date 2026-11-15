> [!NOTE]
> **Room notes, not a solution dump.** Values obtained inside the live room
> (credentials, hashes, flags) are redacted, and terminal output shown here is
> illustrative of the pattern you should expect. Work the room yourself to obtain
> the real values — the point of these notes is the reasoning, not the answers.

## Executive summary

Linux Fundamentals Part 1 is a guided room, and it is easy to finish without
learning anything. Treated as a lab, it establishes the habits that later rooms
assume: reading command output, understanding paths, and knowing how permissions
are represented.

The room covers navigation, file inspection, permissions, and basic process
management. None of it is advanced. All of it is prerequisite knowledge for
privilege escalation, where a misread permission is the difference between a dead
end and root.

## Room information

| Field | Value |
| --- | --- |
| Platform | TryHackMe |
| Room | Linux Fundamentals Part 1 |
| Difficulty | Beginner |
| Operating system | Linux |
| Category | Linux fundamentals |
| Skills | Navigation, file inspection, permissions, processes |

## Objectives

- Move around a filesystem confidently without a GUI.
- Inspect files with `ls`, `file`, `cat`, `head`, `less` and `find`.
- Read and interpret permission bits, ownership and special bits.
- Inspect running processes and understand the parent/child relationship.

## Tools used

| Tool | Purpose |
| --- | --- |
| `ssh` | Connect to the target machine |
| `ls`, `cd`, `pwd` | Navigation |
| `find`, `grep` | Locating content |
| `chmod`, `chown` | Permission changes in the lab |
| `ps`, `top` | Process inspection |

## Initial reconnaissance

The room provides credentials and a host. Connect and orient yourself before
running anything else:

```bash
ssh <user>@<room-ip>
pwd
whoami
id
uname -a
cat /etc/os-release
```

`id` matters more than `whoami`: it shows group membership, which is where most
Linux privilege paths begin.

> [!TIP]
> Run `id` immediately on every new shell. The groups column tells you what the
> account can already reach.

## Enumeration

### The filesystem

```bash
ls -la /
ls -la ~
find / -maxdepth 2 -type d 2>/dev/null | sort
```

The `2>/dev/null` habit is deliberate: suppressing permission errors keeps the
useful output readable.

### File inspection

```bash
file /etc/passwd
head -5 /etc/passwd
less /etc/hosts
```

`file` tells you what something is regardless of its extension. That becomes
important later, when a `.txt` is actually a binary or an archive.

### Permissions

```bash
ls -l /etc/shadow
stat /usr/bin/passwd
```

Read the mode as three groups: owner, group, other. `r` is 4, `w` is 2, `x` is 1.
A file mode of `4755` means setuid is set — the binary runs with the owner's
privileges. The room does not exploit that, but it introduces the notation.

### Processes

```bash
ps aux | head
ps -eo pid,ppid,user,cmd --sort=pid | tail -20
```

Note which processes run as root and which are children of `systemd`. The parent
relationship explains why killing some processes restarts them.

## Vulnerability identification

This room has no vulnerability to exploit. The "finding" is knowledge: the
permission model and the process model that later rooms abuse.

If you want to practise identification here, ask of each file you inspect:

- Who owns it?
- Who can write to it?
- Does it run with elevated privileges?
- Is it in a directory anyone can modify?

Those four questions are the core of Linux privilege escalation.

## Exploitation

Not applicable. The room's exercises are guided commands; complete them and note
what each output means.

## Privilege escalation

Not applicable at this stage. However, the room introduces the vocabulary:

| Concept | Why it matters later |
| --- | --- |
| SUID | A binary that runs as its owner |
| Writable directories | A place to plant files |
| Cron jobs | Code that runs as another user on a schedule |
| `sudo -l` | The first command to run after a shell |

## Flags and completion evidence

Room answers are redacted here. In your own notes, record:

- The command that produced each answer.
- The output format (so you can recognise it later).
- One sentence on why the answer was where it was.

## Lessons learned

- `id` before anything else; groups are capability.
- `file` beats trusting extensions.
- Permission bits are arithmetic, not trivia.
- Suppressing stderr makes enumeration output usable.
- A guided room is only useful if you explain each step to yourself.

## Mitigation and remediation

Not applicable to the room. For a real system, the corresponding controls are:

- Least-privilege accounts and groups.
- No world-writable directories in `PATH`.
- Regular review of SUID binaries.
- Logging of privilege changes (`sudo`, `su`).

## References

- TryHackMe — Linux Fundamentals Part 1.
- `man 7 file-hierarchy`, `man 1 chmod`, `man 5 passwd`.
- OverTheWire Bandit — a complementary progression.
