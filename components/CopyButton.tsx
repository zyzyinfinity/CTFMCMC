"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (non-secure context); fail silently.
    }
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded border px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
