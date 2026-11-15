## Executive Summary

In March 2024, a backdoor was discovered in the `xz-utils` compression library, tracked as **CVE-2024-3094** and rated 10.0 by the maintainers who published it. The payload was not in the released source tarball — it was assembled at build time from obfuscated test fixtures, and in the right conditions it hooked the OpenSSH authentication path.

What makes this incident worth studying two years later is not the exploit. It is the **patience**: a multi-year social-engineering campaign, a maintainer transition, and a supply chain defended by one engineer noticing that SSH logins were 500 milliseconds slower than they should be.

This is analysis of a publicly documented incident. It is not reporting.

> [!NOTE]
> Source: the original disclosure to the oss-security mailing list by Andres Freund, 29 March 2024. Version numbers, CVE identifiers and affected releases below follow that advisory and the subsequent Debian/Fedora security notices.

## What was affected

| Item | Detail |
| --- | --- |
| Component | `xz-utils` / `liblzma` |
| Versions | 5.6.0 (released 2024-02-24), 5.6.1 |
| Fixed | 5.6.2, and 5.4.x branches (reverted) |
| Identifier | CVE-2024-3094 |
| Vector | Supply-chain compromise of upstream source |
| Primary target | `sshd` on systemd-linked Linux distributions |

Only the two 5.6.x releases contained the malicious build logic. Distributions shipping 5.4.x were unaffected, which is why the blast radius was smaller than the initial panic suggested — and why "which version is installed" was the first question every organisation asked.

## The mechanism, in order

### 1. Build-time assembly

The released tarball contained compressed test files. A `m4` macro — `build-to-host.m4` — decompressed those files during configuration and used the result to patch the build. The malicious code existed in the *build* artefacts, not as readable source in the repository.

This is the part defenders should remember: reviewing `git diff` on the repository would not have shown the payload. Only the generated tarball carried it, and tarballs are what distributions build from.

```bash
# the giveaway is in the generated configure stage, not in liblzma/*.c
grep -R "build-to-host" /path/to/xz-5.6.1/
```

### 2. Linker interposition

The payload used `IFUNC` resolvers — a legitimate glibc mechanism for selecting optimised implementations at load time — to replace functions inside `liblzma` at runtime. The same hooks intercepted calls from `libsystemd`, which is linked against `liblzma`.

Because Debian's `sshd` build patched OpenSSH to notify systemd on connection, the chain reached the authentication path:

```text
sshd → libsystemd → liblzma → attacker-controlled hooks
```

The practical effect, per the advisory, was the ability to bypass authentication under specific conditions and execute commands before authentication completed.

### 3. Environmental gating

The hooks activated only when the process name matched `sshd`, keeping the payload dormant in every other context. Ordinary testing — compressing files, running the test suite — produced nothing unusual. This is why the compromise survived weeks of distribution packaging.

## How it was found

Andres Freund, an engineer working on PostgreSQL, noticed anomalous SSH behaviour: logins consuming noticeably more CPU, and connections slower than expected. Profiling pointed at `liblzma` inside `sshd`, which made no sense functionally.

The chain of reasoning that followed — from "SSH is slow" to "a compression library is executing code inside my authentication process" — is the actual detection story. No scanner flagged it. `valgrind` and `strace` did.

> [!WARNING]
> Tooling green does not mean clean. Supply-chain compromise is designed to pass every test the project already runs; the only reliable signal is unexpected behaviour in profiling and runtime observation.

## Timeline worth remembering

| Date | Event |
| --- | --- |
| 2021–2023 | Sustained contributor effort builds trust in the project |
| 2023 | Maintainer adds a second maintainer, who begins changing build scripts |
| 2024-02-24 | xz 5.6.0 released with the build-time changes |
| 2024-03-09 | Debian sid and Fedora rawhide begin carrying 5.6.x |
| 2024-03-29 | Public disclosure; distributions revert to 5.4.x |
| 2024-04 | CVE-2024-3094 published; GitHub suspends the project repository |

## Detection and response, honestly assessed

For most organisations the response was version inventory and rollback. That is correct, and it is also the limit of what most could do.

**What worked:**

- Package inventory: which hosts have `xz` 5.6.0/5.6.1 installed?
- Comparing `sshd` linkage: `ldd $(which sshd) | grep lzma` on affected builds.
- Filesystem hunting for build-time artefacts (`build-to-host.m4`) in build roots.
- Reviewing build provenance for anything that compiles from generated tarballs.

**What did not:**

- Retrospective log hunting for exploitation. The payload's behaviour was subtle, local, and pre-authentication; there is no reliable log signature for "was I targeted before the fix".
- Relying on static analysis of the repository, which never contained the payload.
- Assuming the vendor review process caught it. It did not; a downstream engineer did.

```bash
# inventory check for the affected versions
xz --version
dpkg -l | grep -E "xz-utils|liblzma"    # Debian/Ubuntu
rpm -qa | grep -i xz                    # RHEL/Fedora family
```

```bash
# linkage check: does sshd pull in liblzma on this build?
ldd "$(command -v sshd)" 2>/dev/null | grep -i lzma
```

## What changed in practice

- **Reproducible builds moved up the priority list.** A build that cannot be reproduced cannot be audited.
- **Maintainer transitions became a risk signal.** A new maintainer touching only build scripts is an anomaly worth review, not a courtesy to wave through.
- **Tarball-to-repository drift is now checked** by some distributions; what ships must be diffable against what is reviewed.
- **Build isolation tightened.** Generated code and network access during `configure` are treated as suspicious by default in security-sensitive packages.

## The uncomfortable lesson

The campaign succeeded because it was *social* before it was technical. Trust was earned through genuine contributions over years, then spent on a change nobody needed to read closely: an `m4` macro, a couple of test fixtures, and a version bump.

If you take one operational habit from this incident, make it this: **the important question about a dependency is not only "is it vulnerable" but "who can change what happens when it builds."**

## References

- oss-security — "backdoor in upstream xz/liblzma leading to sshd compromise", 29 March 2024
- NVD — CVE-2024-3094
- Debian Security Advisory DSA-5649-1
- Red Hat — CVE-2024-3094 affected configurations notice
