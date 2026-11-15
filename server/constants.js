// Canonical vocabularies shared across models, controllers and the seeder.

export const ARTICLE_TYPES = [
  "ctf-writeup",
  "tutorial",
  "news",
  "research",
  "article",
];

export const PLATFORMS = [
  "TryHackMe",
  "Hack The Box",
  "PicoCTF",
  "OverTheWire",
  "PortSwigger",
  "CTF",
];

export const DIFFICULTIES = [
  "Beginner",
  "Easy",
  "Intermediate",
  "Medium",
  "Advanced",
  "Hard",
  "Insane",
];

export const OPERATING_SYSTEMS = [
  "Linux",
  "Windows",
  "macOS",
  "Android",
  "Web",
  "Network",
  "Cross-platform",
];

export const STATUSES = ["draft", "published"];

export const ROLES = ["admin"];

export const CATEGORY_SEED = [
  {
    name: "TryHackMe",
    slug: "tryhackme",
    description:
      "Room walkthroughs from TryHackMe — enumeration, exploitation and the reasoning behind each step.",
  },
  {
    name: "Hack The Box",
    slug: "hack-the-box",
    description:
      "Machine writeups from Hack The Box, from the first nmap banner to the final root shell.",
  },
  {
    name: "CTF Writeups",
    slug: "ctf-writeups",
    description:
      "Competition solves across PicoCTF, OverTheWire and one-off capture-the-flag events.",
  },
  {
    name: "Web Security",
    slug: "web-security",
    description:
      "Injection, access control, authentication flaws and the fixes that actually hold.",
  },
  {
    name: "Linux & Privilege Escalation",
    slug: "linux-privilege-escalation",
    description:
      "Local enumeration, misconfigured services and the paths from a low shell to root.",
  },
  {
    name: "Bug Bounty",
    slug: "bug-bounty",
    description:
      "Program mechanics, reconnaissance, vulnerability classes and the reports that get triaged.",
  },
  {
    name: "Web Pentesting",
    slug: "web-pentesting",
    description:
      "Methodology, tooling and reporting for authorised web application penetration tests.",
  },
  {
    name: "Tutorials",
    slug: "tutorials",
    description:
      "Long-form technical teaching: fundamentals, tooling and repeatable methodology.",
  },
  {
    name: "Cybersecurity News",
    slug: "cybersecurity-news",
    description:
      "Advisories, vulnerability analysis and industry developments with technical commentary.",
  },
];
