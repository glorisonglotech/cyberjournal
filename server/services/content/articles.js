import { TUTORIALS } from "./catalog/tutorials.js";
import { WRITEUPS } from "./catalog/writeups.js";

/**
 * Original catalogue for Glorison Cyber Journal.
 *
 * Bodies live in ./markdown/*.md so the seed stays readable. Every entry that
 * is illustrative rather than a record of a real engagement carries
 * `isSample: true`, which the interface surfaces as a Sample badge. The
 * tutorial library and platform write-ups are appended from ./catalog.
 */
const ORIGINAL = [
  {
    slug: "tryhackme-cyberheroes",
    title: "TryHackMe — CyberHeroes: a client-side secret and a borrowed shell",
    excerpt:
      "An easy Linux room where the login form lies to you, the JavaScript tells the truth, and a web shell turns into a foothold.",
    file: "tryhackme-cyberheroes.md",
    categorySlug: "tryhackme",
    articleType: "ctf-writeup",
    platform: "TryHackMe",
    difficulty: "Easy",
    operatingSystem: "Linux",
    skills: ["Web enumeration", "JavaScript analysis", "Command injection", "Linux privilege escalation"],
    tags: ["tryhackme", "web", "command-injection", "privesc", "walkthrough"],
    toolsUsed: ["nmap", "gobuster", "curl", "Burp Suite", "netcat"],
    coverImage: "/covers/tryhackme-cyberheroes.svg",
    featured: false,
    publishedAt: "2026-11-09T09:00:00.000Z",
    seoTitle: "TryHackMe CyberHeroes writeup — client-side auth bypass",
    seoDescription:
      "Full CyberHeroes walkthrough: enumeration, reading the client-side authentication logic, command injection and root.",
    isSample: true,
  },
  {
    slug: "htb-twomillion",
    title: "Hack The Box — TwoMillion: reading the API the way the client does",
    excerpt:
      "A retired easy machine that rewards you for opening DevTools before nmap finishes, then punishes a VPN generator for trusting its input.",
    file: "htb-twomillion.md",
    categorySlug: "hack-the-box",
    articleType: "ctf-writeup",
    platform: "Hack The Box",
    difficulty: "Easy",
    operatingSystem: "Linux",
    skills: ["API enumeration", "Mass assignment", "Command injection", "Privilege escalation"],
    tags: ["hackthebox", "api", "command-injection", "jwt", "privesc"],
    toolsUsed: ["nmap", "ffuf", "Burp Suite", "jq", "linpeas"],
    coverImage: "/covers/htb-twomillion.svg",
    featured: true,
    publishedAt: "2026-10-26T08:30:00.000Z",
    seoTitle: "Hack The Box TwoMillion writeup — API abuse to root",
    seoDescription:
      "TwoMillion walkthrough: invite-code API enumeration, privilege escalation through a mass-assignment flaw, and the path to root.",
    isSample: true,
  },
  {
    slug: "overthewire-bandit-levels-0-10",
    title: "OverTheWire Bandit 0 → 10: the Linux reflexes worth automating",
    excerpt:
      "Ten levels, six commands and one habit worth keeping: read the error message before you read the man page.",
    file: "overthewire-bandit.md",
    categorySlug: "ctf-writeups",
    articleType: "ctf-writeup",
    platform: "OverTheWire",
    difficulty: "Beginner",
    operatingSystem: "Linux",
    skills: ["Linux fundamentals", "SSH", "File permissions", "Text processing"],
    tags: ["overthewire", "linux", "fundamentals", "ctf"],
    toolsUsed: ["ssh", "ls", "find", "grep", "base64", "xxd"],
    coverImage: "/covers/overthewire-bandit.svg",
    featured: false,
    publishedAt: "2026-09-28T07:00:00.000Z",
    seoTitle: "OverTheWire Bandit levels 0–10 walkthrough",
    seoDescription:
      "A practical walkthrough of the first ten Bandit levels with the Linux reasoning behind each command.",
    isSample: false,
  },
  {
    slug: "picoctf-forensics-exif-binwalk",
    title: "PicoCTF forensics: when the metadata is the whole challenge",
    excerpt:
      "A repeatable triage routine for image and archive forensics — exiftool, binwalk, strings and a healthy suspicion of file extensions.",
    file: "picoctf-forensics.md",
    categorySlug: "ctf-writeups",
    articleType: "ctf-writeup",
    platform: "PicoCTF",
    difficulty: "Easy",
    operatingSystem: "Linux",
    skills: ["File forensics", "Metadata analysis", "Archive carving", "Encoding"],
    tags: ["picoctf", "forensics", "exiftool", "binwalk", "steganography"],
    toolsUsed: ["exiftool", "binwalk", "strings", "file", "zsteg"],
    coverImage: "/covers/picoctf-forensics.svg",
    featured: false,
    publishedAt: "2026-09-14T10:15:00.000Z",
    seoTitle: "PicoCTF forensics methodology — metadata, carving, decoding",
    seoDescription:
      "How to triage a forensics challenge image: metadata, embedded archives, strings and decoding layers without guessing.",
    isSample: true,
  },
  {
    slug: "understanding-sql-injection",
    title: "Understanding SQL injection, from the query to the fix",
    excerpt:
      "Injection is not a payload list. It is a boundary failure — and once you can see where data becomes code, the fixes stop being guesswork.",
    file: "understanding-sql-injection.md",
    categorySlug: "web-security",
    articleType: "tutorial",
    platform: "",
    difficulty: "Beginner",
    operatingSystem: "Web",
    skills: ["SQL", "Input handling", "Query parameterisation", "Secure code review"],
    tags: ["sql-injection", "web-security", "owasp", "mysql", "nodejs"],
    toolsUsed: ["MySQL", "sqlmap", "Burp Suite", "Node.js"],
    coverImage: "/covers/understanding-sql-injection.svg",
    featured: false,
    publishedAt: "2026-10-19T09:45:00.000Z",
    seoTitle: "SQL injection explained — query anatomy and remediation",
    seoDescription:
      "A first-principles SQL injection tutorial: how string concatenation becomes injection, how to prove it, and how to parameterise the fix.",
    isSample: false,
  },
  {
    slug: "linux-privilege-escalation-introduction",
    title: "Introduction to Linux privilege escalation",
    excerpt:
      "A methodical pass over the things that actually turn a low shell into root: identity, sudo, file permissions, cron, services and capabilities.",
    file: "linux-privilege-escalation.md",
    categorySlug: "linux-privilege-escalation",
    articleType: "tutorial",
    platform: "",
    difficulty: "Intermediate",
    operatingSystem: "Linux",
    skills: ["Local enumeration", "SUID analysis", "Sudo abuse", "Cron and service misconfiguration", "Capabilities"],
    tags: ["linux", "privesc", "sudo", "suid", "capabilities"],
    toolsUsed: ["linpeas", "find", "sudo", "getcap", "GTFOBins"],
    coverImage: "/covers/linux-privilege-escalation.svg",
    featured: false,
    publishedAt: "2026-10-12T08:00:00.000Z",
    seoTitle: "Linux privilege escalation — a practical methodology",
    seoDescription:
      "Learn Linux privilege escalation in order: identity and context, sudo rights, SUID binaries, scheduled jobs, services and capabilities.",
    isSample: false,
  },
  {
    slug: "understanding-api-security",
    title: "Understanding API security beyond the OWASP checklist",
    excerpt:
      "Broken object-level authorisation, mass assignment and token design cause most real API breaches — none of them are caught by a scanner.",
    file: "understanding-api-security.md",
    categorySlug: "tutorials",
    articleType: "tutorial",
    platform: "",
    difficulty: "Intermediate",
    operatingSystem: "Web",
    skills: ["API threat modelling", "Authorisation testing", "Mass assignment", "JWT validation", "Rate limiting"],
    tags: ["api", "owasp-api-top-10", "jwt", "authorization", "express"],
    toolsUsed: ["Burp Suite", "Postman", "jwt.io", "Express"],
    coverImage: "/covers/understanding-api-security.svg",
    featured: false,
    publishedAt: "2026-11-02T11:20:00.000Z",
    seoTitle: "API security tutorial — BOLA, mass assignment, token design",
    seoDescription:
      "A practical API security tutorial covering object-level authorisation, mass assignment, JWT validation and the tests that expose them.",
    isSample: false,
  },
  {
    slug: "xz-utils-supply-chain-analysis",
    title: "Anatomy of the xz-utils backdoor: what a build system nearly shipped",
    excerpt:
      "CVE-2024-3094 was not a clever exploit. It was eighteen months of patient contribution, and it almost worked.",
    file: "xz-utils-analysis.md",
    categorySlug: "cybersecurity-news",
    articleType: "research",
    platform: "",
    difficulty: "",
    operatingSystem: "Linux",
    skills: ["Supply-chain analysis", "Build-system review", "Incident timeline", "Detection engineering"],
    tags: ["supply-chain", "cve-2024-3094", "linux", "backdoor", "analysis"],
    toolsUsed: ["git", "OpenSSH", "systemd", "auditd"],
    coverImage: "/covers/xz-utils-supply-chain.svg",
    featured: false,
    publishedAt: "2026-11-12T07:30:00.000Z",
    seoTitle: "CVE-2024-3094 analysis — the xz-utils supply-chain backdoor",
    seoDescription:
      "A technical retrospective on CVE-2024-3094: how the xz-utils backdoor was introduced, why it targeted sshd, and what detection actually helps.",
    isSample: false,
    source: {
      name: "oss-security mailing list — backdoor in upstream xz/liblzma",
      url: "https://www.openwall.com/lists/oss-security/2024/03/29/4",
    },
  },
  {
    slug: "reading-cvss-vectors-properly",
    title: "Reading a CVSS vector instead of arguing about the score",
    excerpt:
      "A sample analysis piece on why two teams can score the same CVE six points apart, and how the vector string settles the argument.",
    file: "cvss-vector-analysis.md",
    categorySlug: "cybersecurity-news",
    articleType: "news",
    platform: "",
    difficulty: "",
    operatingSystem: "",
    skills: ["Risk scoring", "Vulnerability triage", "CVSS interpretation"],
    tags: ["cvss", "vulnerability-management", "triage", "sample"],
    toolsUsed: ["NVD", "CVSS calculator"],
    coverImage: "/covers/cvss-vector-analysis.svg",
    featured: false,
    publishedAt: "2026-11-05T12:00:00.000Z",
    seoTitle: "How to read a CVSS vector string — sample analysis",
    seoDescription:
      "Sample commentary: how CVSS base, temporal and environmental metrics combine, and when a high score is not the highest priority.",
    isSample: true,
    source: {
      name: "FIRST — Common Vulnerability Scoring System v3.1 specification",
      url: "https://www.first.org/cvss/v3-1/specification-document",
    },
  },
];

export const ARTICLES = [...ORIGINAL, ...TUTORIALS, ...WRITEUPS];
