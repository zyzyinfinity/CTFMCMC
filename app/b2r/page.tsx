import Link from "next/link";
import { b2rCategories, techniquesForCategory } from "@/lib/content";
import Flowchart from "@/components/Flowchart";

export const metadata = { title: "Boot2Root — CTF Arsenal" };

const decisionTree: { condition: string; href: string; label: string }[] = [
  { condition: "Just an IP", href: "/b2r/enumeration", label: "Enumeration" },
  { condition: "Web app running", href: "/b2r/web-exploitation", label: "Web Exploitation" },
  { condition: "Got a shell", href: "/b2r/privesc-linux", label: "Privilege Escalation" },
  { condition: "Got a hash", href: "/b2r/credential-attacks", label: "Credential Attacks" },
];

export default function B2ROverview() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">Boot2Root</h1>
      <p className="mb-4 text-sm text-[var(--text-dim)]">
        Linux/web penetration-testing methodology for CTF targets: enumerate, exploit, gain a foothold, escalate.
      </p>

      <Link
        href="/b2r/zero-to-root"
        className="mb-6 block rounded-md border-2 p-4 transition-colors hover:border-[var(--accent)]"
        style={{ borderColor: "var(--accent)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--accent)]">⚡ Zero to Root — Full Walkthrough</h2>
          <span className="text-xs text-[var(--text-faint)]">start here →</span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-dim)]">
          One illustrative training run through a representative easy-medium box, step by step, with expected output and branches.
        </p>
      </Link>

      <div className="mb-8 rounded-md border p-4" style={{ borderColor: "var(--border)" }}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">What do you have right now?</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {decisionTree.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm hover:border-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-[var(--text-dim)]">{d.condition}</span>
              <span className="text-[var(--accent)]">→ {d.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <Flowchart
          title="Default investigation path"
          steps={["Target", "Enumeration", "Service Discovery", "Vulnerability ID", "Initial Access", "Shell Stabilization", "Privilege Escalation", "Root"]}
        />
      </div>

      <div className="space-y-2">
        {b2rCategories.map((cat) => {
          const count = techniquesForCategory("b2r", cat.slug).length;
          return (
            <Link
              key={cat.slug}
              href={`/b2r/${cat.slug}`}
              className="block rounded-md border p-3 hover:border-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{cat.title}</h2>
                <span className="text-xs text-[var(--text-faint)]">{count} technique{count !== 1 ? "s" : ""}</span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--text-dim)]">{cat.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-[var(--text-dim)]">
        Stuck?{" "}
        <Link href="/b2r/when-the-playbook-doesnt-work" className="text-[var(--accent)] hover:underline">
          When the playbook doesn&apos;t work →
        </Link>
      </div>
    </div>
  );
}
