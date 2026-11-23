import { MistakeEntry } from "@/lib/content/types";
import CopyButton from "./CopyButton";

export default function MistakeView({ mistake }: { mistake: MistakeEntry }) {
  const sectionLabel = mistake.section === "b2r" ? "Boot2Root" : "DFIR";
  const rows: { label: string; value: string }[] = [
    { label: "1. Error or symptom", value: mistake.symptom },
    { label: "2. Likely cause", value: mistake.likelyCause },
    { label: "3. How to verify", value: mistake.verify },
  ];

  return (
    <article className="max-w-3xl">
      <div className="mb-1 text-xs text-[var(--text-faint)]">{sectionLabel} / Command Mistakes & Recovery</div>
      <h1 className="mb-4 text-2xl font-semibold">{mistake.title}</h1>

      <div className="space-y-4 text-sm">
        {rows.map((r) => (
          <div key={r.label}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{r.label}</p>
            <p>{r.value}</p>
          </div>
        ))}

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">4. Correct command</p>
          <div className="flex items-start gap-2">
            <pre
              className="flex-1 overflow-x-auto whitespace-pre-wrap rounded border p-2 text-[13px] text-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--code-bg)" }}
            >
              {mistake.correctCommand}
            </pre>
            <CopyButton text={mistake.correctCommand} />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">5. Recovery procedure</p>
          <p>{mistake.recovery}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">6. How to avoid repeating it</p>
          <p>{mistake.avoid}</p>
        </div>
      </div>
    </article>
  );
}
