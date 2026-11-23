import Link from "next/link";
import { b2rCategories, techniquesForCategory } from "@/lib/content";
import Flowchart from "@/components/Flowchart";

export const metadata = { title: "Boot2Root — CTF Arsenal" };

export default function B2ROverview() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">Boot2Root</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        Linux/web penetration-testing methodology for CTF targets: enumerate, exploit, gain a foothold, escalate.
      </p>

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
    </div>
  );
}
