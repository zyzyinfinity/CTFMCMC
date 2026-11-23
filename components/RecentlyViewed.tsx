"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecent, RecentItem } from "@/lib/recent";

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, a client-only external store
    setItems(getRecent());
  }, []);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-faint)]">
        Nothing viewed yet. Browse Boot2Root or DFIR to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex items-baseline justify-between gap-3 rounded px-2 py-1.5 -mx-2 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <span className="truncate text-sm group-hover:text-[var(--accent)]">{item.title}</span>
            <span className="shrink-0 text-[11px] text-[var(--text-faint)]">{item.sectionLabel}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
