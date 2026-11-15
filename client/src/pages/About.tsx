import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { OwlMark } from "../components/Logo";

const INTERESTS = [
  "Web application security",
  "API security and access control",
  "Linux privilege escalation",
  "Reconnaissance methodology",
  "SOC analysis and detection",
  "Secure full-stack engineering",
];

const SOCIALS = [
  { href: "https://github.com/glorisonglotech", label: "GitHub" },
  { href: "https://linkedin.com/in/glorison", label: "LinkedIn" },
  { href: "https://x.com/glorison01", label: "X / Twitter" },
];

const PHILOSOPHY = [
  {
    title: "Reproduce before publishing",
    body: "A step that only worked once, by accident, is not a technique. Notes are re-run from a clean state before they are filed.",
  },
  {
    title: "Name the root cause",
    body: "Every finding ends with the design decision that allowed it — not just the payload that exploited it. Fixes should remove the class, not the instance.",
  },
  {
    title: "Respect the scope",
    body: "Testing happens in authorised labs or against retired targets. No live system is touched for content, and no flag is treated as an achievement worth more than the method.",
  },
];

/* Section heading: index + title, same text as before. */
function SectionHead({ index, children }: { index: string; children: ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-3 text-[15px] font-semibold text-bone">
      <span className="mono text-[13px] font-normal text-dim">{index}</span>
      {children}
    </h2>
  );
}

const H2 =
  "display font-serif text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-[-0.02em] text-bone";

export default function About() {
  usePageMeta({
    title: "About",
    description:
      "Glorison Cyber Journal is a personal security research publication documenting CTF writeups, tutorials and vulnerability analysis.",
  });

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-rule">
        <div className="shell pt-14 pb-14 md:pt-20 md:pb-20">
          <p className="text-[16px] font-medium text-signal">Publication / colophon</p>

          <div className="mt-6 grid items-end gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-8">
              <h1 className="display font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.02] font-medium tracking-[-0.025em] text-bone">
                About the
                <br />
                journal
              </h1>
              <p className="mt-8 max-w-2xl text-[19px] leading-relaxed text-bone-dim">
                A working publication by <span className="text-bone">Glorison Ouma</span> —
                cybersecurity analyst, penetration tester and full-stack engineer based in Kenya.
                Everything here is written from the lab: the commands that worked, the assumptions
                that did not, and the fix that followed.
              </p>
            </div>

            <div className="md:col-span-3 md:col-start-10">
              <div className="rounded-md bg-paper-2 p-7">
                <OwlMark size={72} />
                <p className="mt-5 border-t border-rule pt-4 text-[14px] leading-relaxed text-dim">
                  The owl is the mark of
                  <br />
                  the journal: patient,
                  <br />
                  observant, nocturnal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 01 Purpose ─────────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="shell py-16 md:py-24">
          <SectionHead index="01">Purpose</SectionHead>

          <h2 className={`${H2} mt-8 max-w-3xl`}>
            Documentation as a discipline, not a byproduct.
          </h2>

          <div className="mt-12 grid md:grid-cols-12">
            <div className="space-y-5 text-[17px] leading-relaxed text-bone-dim md:col-span-7 md:col-start-5">
              <p className="dropcap">
                Most security knowledge is lost between the shell and the report. A machine is
                rooted, a finding is escalated, and the reasoning disappears into a terminal
                scrollback. This journal exists to keep that reasoning: the enumeration order, the
                dead ends, the moment a vulnerability stopped being abstract.
              </p>
              <p>
                It also serves as a reference library for my own work. When I meet a similar
                service, a familiar misconfiguration or a vulnerability class I have already
                documented, I want the notes to be precise enough to reuse — not a summary written
                from memory months later.
              </p>
              <p>
                Every writeup is published only after the lab is complete and the steps have been
                reproduced from a clean state. Sample or demonstration entries are labelled as
                such, and news analysis always links to its primary source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 Focus ───────────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="shell py-16 md:py-24">
          <SectionHead index="02">Focus</SectionHead>

          <div className="mt-8 grid gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-5">
              <h2 className={H2}>Offence understood, defence written.</h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dim">
                The work sits at the intersection of application security, penetration testing and
                SOC analysis — grounded in engineering, so every remediation ships as working code.
              </p>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <ul className="grid gap-x-10 border-b border-rule sm:grid-cols-2">
                {INTERESTS.map((interest, index) => (
                  <li
                    key={interest}
                    className="flex items-baseline gap-4 border-t border-rule py-4"
                  >
                    <span className="mono text-[13px] text-dim">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[17px] leading-snug text-bone">{interest}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-[15px] text-dim">
                <span>TryHackMe</span>
                <span>Hack The Box</span>
                <span>PicoCTF</span>
                <span>OverTheWire</span>
                <span>PortSwigger Academy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 Philosophy ──────────────────────────────────────────────── */}
      <section className="border-b border-rule bg-paper-2">
        <div className="shell py-16 md:py-24">
          <SectionHead index="03">Philosophy</SectionHead>

          <h2 className={`${H2} mt-8 max-w-2xl`}>Learning in public, carefully.</h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {PHILOSOPHY.map((item) => (
              <div key={item.title} className="border-t-2 border-bone pt-5">
                <h3 className="font-serif text-[22px] leading-snug font-medium tracking-[-0.01em] text-bone">
                  {item.title}
                </h3>
                <p className="mt-3 text-[16px] leading-relaxed text-bone-dim">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 Elsewhere ───────────────────────────────────────────────── */}
      <section>
        <div className="shell py-16 md:py-24">
          <SectionHead index="04">Elsewhere</SectionHead>

          <div className="mt-8 grid gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-5">
              <h2 className={H2}>The professional work lives next door.</h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-dim">
                Services, engagements, certifications and full-stack projects are documented on my
                main portfolio.
              </p>
              <a
                href="https://glorison.netlify.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary mt-8"
              >
                Visit glorison.netlify.app <ArrowUpRight size={15} />
              </a>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <dl className="divide-y divide-rule border-y border-rule">
                <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4 py-4">
                  <dt className="text-[14px] text-dim">Email</dt>
                  <dd>
                    <a
                      href="mailto:glorisonglotech@gmail.com"
                      className="text-[17px] text-bone underline decoration-ghost underline-offset-4 transition-colors hover:text-signal hover:decoration-signal"
                    >
                      glorisonglotech@gmail.com
                    </a>
                  </dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4 py-4">
                  <dt className="text-[14px] text-dim">Location</dt>
                  <dd className="text-[17px] text-bone">Kenya · EAT / UTC+3</dd>
                </div>
              </dl>

              <ul className="mt-8 divide-y divide-rule border-y border-rule">
                {SOCIALS.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center justify-between py-4"
                    >
                      <span className="text-[17px] text-bone transition-colors group-hover:text-signal">
                        {social.label}
                      </span>
                      <ArrowUpRight
                        size={16}
                        className="text-ghost transition-colors group-hover:text-signal"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}