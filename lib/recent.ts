"use client";

const KEY = "ctf-arsenal-recent";
const MAX = 8;

export interface RecentItem {
  title: string;
  href: string;
  sectionLabel: string;
  categoryLabel: string;
  ts: number;
}

export function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(item: Omit<RecentItem, "ts">) {
  if (typeof window === "undefined") return;
  const existing = getRecent().filter((i) => i.href !== item.href);
  const next = [{ ...item, ts: Date.now() }, ...existing].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
