"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchDocs, SearchDoc } from "@/lib/search";
import { highlight } from "@/lib/highlight";

export default function SearchBar({
  size = "normal",
  autoFocus = false,
  placeholder = "Search tools, commands, techniques, errors…",
}: {
  size?: "normal" | "large";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchDoc[]>(() => searchDocs(query, 10), [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results[0]) {
      router.push(results[0].href);
      setOpen(false);
    } else if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const big = size === "large";

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={onSubmit} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={`w-full rounded-md border bg-[var(--bg-elevated)] outline-none transition-colors focus:border-[var(--accent)] ${
              big ? "px-4 py-3 text-base" : "px-3 py-1.5 text-sm"
            }`}
            style={{ borderColor: "var(--border)" }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className={`rounded-md border font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ${
            big ? "px-5 py-3 text-sm" : "px-3 py-1.5 text-xs"
          }`}
          style={{ borderColor: "var(--border)" }}
        >
          Search
        </button>
      </form>

      {open && query.trim() && (
        <div
          className="absolute z-20 mt-1 w-full rounded-md border bg-[var(--bg-elevated)] shadow-xl max-h-96 overflow-y-auto"
          style={{ borderColor: "var(--border)" }}
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-faint)]">
              No matches for &ldquo;{query}&rdquo;. Try a tool name, command, CVE, file extension, or protocol.
            </div>
          ) : (
            <>
              <ul>
                {results.map((r) => (
                  <li key={r.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <Link
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{highlight(r.title, query)}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--text-faint)]">
                          {r.sectionLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-faint)]">{r.categoryLabel}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-[var(--text-dim)]">{highlight(r.snippet, query)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-center text-xs text-[var(--accent)] hover:underline"
              >
                View all results →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
