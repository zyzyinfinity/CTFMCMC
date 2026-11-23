import CopyButton from "./CopyButton";

interface WalkthroughStepProps {
  step: string;
  title: string;
  why?: string;
  command?: string;
  expectedOutput?: string;
  next: React.ReactNode;
  altersState?: boolean;
}

export default function WalkthroughStep({ step, title, why, command, expectedOutput, next, altersState }: WalkthroughStepProps) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-medium">
          <span className="text-[var(--accent)]">{step}</span> — {title}
        </h3>
        {altersState && (
          <span
            className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
            style={{ borderColor: "var(--border)", color: "var(--danger)" }}
          >
            ⚠️ alters state
          </span>
        )}
      </div>
      {why && <p className="mb-2 text-sm text-[var(--text-dim)]">{why}</p>}
      {command && (
        <div className="mb-2 flex items-start gap-2">
          <pre
            className="flex-1 overflow-x-auto whitespace-pre-wrap break-all rounded border p-2 text-[13px] text-[var(--accent)]"
            style={{ borderColor: "var(--border)", background: "var(--code-bg)" }}
          >
            {command}
          </pre>
          <CopyButton text={command} />
        </div>
      )}
      {expectedOutput && (
        <details className="group mb-2 text-sm">
          <summary className="cursor-pointer text-[var(--text-faint)] select-none">
            <span className="inline-block transition-transform group-open:rotate-90">▶️</span> Expected output
          </summary>
          <pre
            className="mt-1 overflow-x-auto whitespace-pre-wrap rounded p-2 text-[12px] text-[var(--text-dim)]"
            style={{ background: "var(--code-bg)" }}
          >
            {expectedOutput}
          </pre>
        </details>
      )}
      <p className="text-sm">
        <span className="font-semibold text-[var(--text-faint)]">Next: </span>
        {next}
      </p>
    </div>
  );
}
