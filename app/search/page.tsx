"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { searchDocs } from "@/lib/search";
import { highlight } from "@/lib/highlight";

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const results = useMemo(() => searchDocs(q, 100), [q]);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold">Search results</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        {results.length} match{results.length !== 1 ? "es" : ""} for &ldquo;{q}&rdquo;
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">
          No matches for &ldquo;{q}&rdquo;. Try a tool name, command, protocol, file extension, or error message.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                href={r.href}
                className="block rounded-md border p-3 hover:border-[var(--accent)] transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{highlight(r.title, q)}</span>
                  <span className="shrink-0 text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
                    {r.sectionLabel} / {r.categoryLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-dim)]">{highlight(r.snippet, q)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
