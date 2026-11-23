import Link from "next/link";

export const metadata = { title: "When the Playbook Doesn't Work — CTF Arsenal" };

const items: { title: string; detail: string }[] = [
  {
    title: "Re-run full enumeration rather than trusting the first scan",
    detail: "A quick top-1000 scan, a thin wordlist, or a scan taken before the service was ready can all under-report. Re-run with -p- and a bigger wordlist before concluding the surface is fully mapped.",
  },
  {
    title: "Check for backup/hidden/config files you skipped",
    detail: ".bak, .old, .swp, .git, .env, ~ backup files, and anything gobuster/ffuf returned a non-200 for but never actually opened.",
  },
  {
    title: "Re-read page source/output more carefully",
    detail: "view-source, HTML comments, JS files for hardcoded endpoints/keys, and response headers — not just the rendered page.",
  },
  {
    title: "Try the adjacent technique in the same category",
    detail: "If one web-exploitation vector is clean, the next one over (LFI vs SQLi vs upload abuse) is often the actual path — don't fixate on the first thing that looked promising.",
  },
  {
    title: "Confirm TARGET_IP hasn't gone stale",
    detail: "VPN/lab resets, box respawns, and expired instances all silently change the IP or reset state mid-session — re-verify with a fresh ping/scan before debugging a 'broken' exploit that's actually just pointed at a dead target.",
  },
];

export default function PlaybookDoesntWork() {
  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-xs text-[var(--text-faint)]">Boot2Root</div>
      <h1 className="mb-3 text-2xl font-semibold">When the Playbook Doesn&apos;t Work</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        &ldquo;Easy-medium&rdquo; is a floor, not a guarantee — expect at least one non-textbook twist. Before assuming a box is
        broken or beyond scope, work through this checklist in order.
      </p>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={item.title} className="rounded-md border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]"
                style={{ borderColor: "var(--border)" }}
              >
                {i + 1}
              </span>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--text-dim)]">{item.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-md border p-4 text-sm" style={{ borderColor: "var(--border)" }}>
        Starting from scratch? See{" "}
        <Link href="/b2r/zero-to-root" className="text-[var(--accent)] hover:underline">
          Zero to Root — Full Walkthrough
        </Link>
        . Already have a shell or a hash?{" "}
        <Link href="/b2r" className="text-[var(--accent)] hover:underline">
          Use the decision tree on the B2R landing page
        </Link>
        .
      </div>
    </div>
  );
}
