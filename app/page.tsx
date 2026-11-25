import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import RecentlyViewed from "@/components/RecentlyViewed";
import QuickCommands from "@/components/QuickCommands";
import { allTechniques, allMistakes } from "@/lib/content";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="mb-1 text-xl font-semibold">
          <span className="text-[var(--accent)]">CTF</span> Arsenal
        </h1>
        <p className="mb-5 text-sm text-[var(--text-faint)]">
          Offline Boot2Root & DFIR field manual — {allTechniques.length} techniques, {allMistakes.length} recovery
          entries.
        </p>
        <SearchBar size="large" placeholder="nmap, SUID, pcap, volatility, reverse shell…" />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/b2r"
          className="rounded-md border p-4 hover:border-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold">Boot2Root</h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            Enumeration, web exploitation, foothold, Linux privilege escalation, credential attacks.
          </p>
        </Link>
        <Link
          href="/dfir"
          className="rounded-md border p-4 hover:border-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold">Digital Forensics & IR</h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            File, network, malware, memory, disk, email, log, archive, document, Windows artifact and Git forensics,
            encoding/decoding, plus IR methodology.
          </p>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Recently Viewed</h3>
          </div>
          <RecentlyViewed />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">Quick Commands</h3>
          </div>
          <QuickCommands />
        </section>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/b2r/enumeration/ip-only-to-credentials"
          className="block rounded-md border p-4 text-center hover:border-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-medium">IP-Only → Credentials Playbook →</span>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            Only given a target IP? Step-by-step: scan, enumerate, exploit, harvest and crack credentials.
          </p>
        </Link>
        <Link
          href="/mistakes"
          className="block rounded-md border p-4 text-center hover:border-[var(--accent)] transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-medium">Command Mistakes & Recovery →</span>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            Fast fixes for failed commands, wrong flags, dead shells, and more.
          </p>
        </Link>
      </section>
    </div>
  );
}
