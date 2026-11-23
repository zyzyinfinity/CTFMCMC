import Link from "next/link";
import { mistakesFor } from "@/lib/content";

export const metadata = { title: "Command Mistakes & Recovery — CTF Arsenal" };

export default function MistakesPage() {
  const b2r = mistakesFor("b2r");
  const dfir = mistakesFor("dfir");

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">Command Mistakes & Get Back on Track</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        Fast lookups for errors, wrong flags, and dead ends — organized by section. Use the search bar for the
        fastest path to a specific symptom.
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-dim)]">Boot2Root</h2>
          <ul className="space-y-1">
            {b2r.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/mistakes/b2r/${m.slug}`}
                  className="block rounded px-2 py-1.5 -mx-2 text-sm hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
                >
                  {m.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-dim)]">DFIR</h2>
          <ul className="space-y-1">
            {dfir.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/mistakes/dfir/${m.slug}`}
                  className="block rounded px-2 py-1.5 -mx-2 text-sm hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
                >
                  {m.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
