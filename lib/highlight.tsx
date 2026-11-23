import React from "react";

/** Wraps case-insensitive occurrences of query terms in <mark>. Plain text in, React nodes out. */
export function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const terms = q.split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length === 0) return text;
  const re = new RegExp(`(${terms.join("|")})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 && part.length > 0 ? (
      <mark key={i} className="search-hit">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
