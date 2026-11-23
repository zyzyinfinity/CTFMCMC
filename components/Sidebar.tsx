"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { b2rCategories, dfirCategories, techniquesForCategory } from "@/lib/content";
import { Section } from "@/lib/content/types";

function SectionGroup({ section, label }: { section: Section; label: string }) {
  const pathname = usePathname();
  const categories = section === "b2r" ? b2rCategories : dfirCategories;
  const sectionActive = pathname?.startsWith(`/${section}`);

  return (
    <details open={!!sectionActive} className="group">
      <summary className="flex items-center justify-between rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]">
        <Link href={`/${section}`} className="hover:text-[var(--accent)]">
          {label}
        </Link>
        <span className="transition-transform group-open:rotate-90 text-[var(--text-faint)]">▸</span>
      </summary>
      <ul className="mt-0.5 space-y-0.5 pl-2">
        {categories.map((cat) => {
          const techniques = techniquesForCategory(section, cat.slug);
          const catHref = `/${section}/${cat.slug}`;
          const catActive = pathname?.startsWith(catHref);
          return (
            <li key={cat.slug}>
              <details open={!!catActive}>
                <summary className="flex items-center justify-between rounded px-2 py-1 text-[13px] hover:bg-[var(--bg-hover)]">
                  <Link
                    href={catHref}
                    className={catActive ? "text-[var(--accent)]" : "text-[var(--text)]"}
                  >
                    {cat.title}
                  </Link>
                </summary>
                <ul className="ml-2 border-l pl-2" style={{ borderColor: "var(--border)" }}>
                  {techniques.map((t) => {
                    const href = `/${section}/${cat.slug}/${t.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={t.slug}>
                        <Link
                          href={href}
                          className={`block truncate rounded px-2 py-1 text-[12.5px] hover:bg-[var(--bg-hover)] ${
                            active ? "text-[var(--accent)]" : "text-[var(--text-dim)]"
                          }`}
                        >
                          {t.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const mistakesActive = pathname?.startsWith("/mistakes");

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3 text-sm">
      <SectionGroup section="b2r" label="Boot2Root" />
      <SectionGroup section="dfir" label="Digital Forensics & IR" />
      <div className="mt-1 border-t pt-2" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/mistakes"
          className={`block rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-[var(--bg-hover)] ${
            mistakesActive ? "text-[var(--accent)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          Command Mistakes & Recovery
        </Link>
      </div>
    </nav>
  );
}
