export default function Flowchart({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: "var(--border)" }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-dim)]">{title}</p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="rounded border px-2.5 py-1.5 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              {step}
            </span>
            {i < steps.length - 1 && <span className="text-[var(--text-faint)]">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
