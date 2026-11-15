## Executive Summary

Bandit is not a puzzle game. It is a muscle-memory drill for the shell commands you will type ten thousand times, wrapped in a progress bar. Levels 0 to 10 cover SSH, file discovery, permission bits, text filtering, encoding and one important idea: the answer is usually in the error message.

This walkthrough shows the command *and* the reasoning, because copying the answer teaches you nothing at level 11.

## Before You Start

```bash
ssh -p 2220 bandit0@bandit.labs.overthewire.org
```

The password for each level is the flag from the previous one. Keep a local note file — you will need to re-authenticate every time a session drops:

```bash
mkdir -p ~/bandit && cd ~/bandit
printf 'level 0: bandit0\n' >> notes.txt
```

> [!TIP]
> Use one terminal for the shell and a second for notes. Losing a password to scrollback is the most common way people stall in Bandit.

## Level 0 → 1: read the obvious file

```bash
ls -la
cat readme
```

The first level exists to establish the loop: connect, look, read, disconnect, reconnect with the password you found.

## Level 1 → 2: a filename that fights back

```bash
ls
# -
cat ./-
```

A file literally named `-` looks like a flag to `cat`. Prefix the path with `./` so the shell treats it as a file rather than an option. The general fix for any awkward filename is `--`:

```bash
cat -- -
```

## Level 2 → 3: spaces in the filename

```bash
ls -la
cat "spaces in this filename"
```

Quote it, or escape each space with a backslash. Unquoted, the shell splits it into four arguments and `cat` complains about files that do not exist.

## Level 3 → 4: hidden files

```bash
ls -la inhere/
cat inhere/...Hiding-From-You
```

`ls` without `-a` skips dotfiles. Every enumeration checklist starts with `ls -la` for this reason.

## Level 4 → 5: find by type and size

```bash
file inhere/* | grep "ASCII text"
```

`file` reports what a file actually is, regardless of its extension. Filtering by human-readable text is faster than opening every candidate.

## Level 5 → 6: find by permission bits

```bash
find inhere/ -type f -size 1033c ! -executable
cat inhere/maybehere07/.file2
```

Three predicates, one result. `-size 1033c` means exactly 1033 bytes; `c` is crucial — without a unit suffix `find` interprets the number as 512-byte blocks and matches nothing.

## Level 6 → 7: search the filesystem

```bash
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null
```

Redirecting stderr matters: searching `/` as an unprivileged user generates hundreds of permission errors that bury the one useful line.

## Level 7 → 8: grep a large file

```bash
grep "millionth" data.txt
```

```text
millionth	<redacted>
```

For larger files, `grep -n` gives you the line number, and `awk '{print $2}'` extracts the second column directly:

```bash
grep "millionth" data.txt | awk '{print $2}'
```

## Level 8 → 9: the only unique line

```bash
sort data.txt | uniq -u
```

`uniq` only collapses *adjacent* duplicates, which is why `sort` comes first. This pairing is the standard way to find a value that appears exactly once.

## Level 9 → 10: strings in a binary

```bash
strings data.txt | grep "==="
```

`strings` extracts printable runs from a binary. The target line is marked with `===`, which makes the filter trivial — but the habit is the point: never `cat` a binary.

## Level 10 → 11: base64

```bash
base64 -d data.txt
```

```text
The password is <redacted>
```

Recognise the encoding from the alphabet (`A–Z a–z 0–9 + /` and `=` padding). Then decode with the matching tool rather than guessing at the content:

```bash
# quick identification of unknown text
file data.txt
head -c 80 data.txt
```

## The Pattern Behind the Levels

| Level | Skill | Command |
| --- | --- | --- |
| 0 → 1 | Reading a file | `cat readme` |
| 1 → 2 | Option-like filenames | `cat ./-` |
| 2 → 3 | Quoting | `cat "spaces in this filename"` |
| 3 → 4 | Hidden files | `ls -la` |
| 4 → 5 | File type | `file` |
| 5 → 6 | Size filtering | `find -size 1033c` |
| 6 → 7 | Ownership search | `find / -user ...` |
| 7 → 8 | Text search | `grep` |
| 8 → 9 | Unique lines | `sort \| uniq -u` |
| 9 → 10 | Binary strings | `strings` |
| 10 → 11 | Encoding | `base64 -d` |

## Lessons Learned

- **Read errors before changing approach.** "No such file" and "Permission denied" point at different fixes.
- **`ls -la` is not optional.** Hidden files are a deliberate design choice in real targets too.
- **`find` is a query language.** Combining `-user`, `-perm`, `-size` and `-type` is how you locate credentials during privilege escalation.
- **Quote paths.** Spaces and leading dashes break naive commands in exactly the situations where you cannot afford a retry.

## Tools Used

`ssh`, `ls`, `cat`, `file`, `find`, `grep`, `sort`, `uniq`, `strings`, `base64`.

## References

- OverTheWire — Bandit
- `man find`, section on `-size` suffixes
