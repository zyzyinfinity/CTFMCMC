import { Technique } from "@/lib/content/types";
import CopyButton from "./CopyButton";
import TrackVisit from "./TrackVisit";
import { categoryTitle } from "@/lib/content";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "danger" | "warn" }) {
  const color = tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn)" : "var(--text-dim)";
  return (
    <span
      className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
      style={{ borderColor: "var(--border)", color }}
    >
      {children}
    </span>
  );
}

export default function TechniqueView({ technique }: { technique: Technique }) {
  const sectionLabel = technique.section === "b2r" ? "Boot2Root" : "DFIR";
  const catLabel = categoryTitle(technique.section, technique.category);

  return (
    <article className="max-w-3xl">
      <TrackVisit
        title={technique.title}
        href={`/${technique.section}/${technique.category}/${technique.slug}`}
        sectionLabel={sectionLabel}
        categoryLabel={catLabel}
      />

      <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-faint)]">
        <span>{sectionLabel}</span>
        <span>/</span>
        <span>{catLabel}</span>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">{technique.title}</h1>

      <Section title="Concept">
        <p className="text-[var(--text)]">{technique.concept}</p>
      </Section>

      <Section title="When to Use">
        <ul className="list-inside list-disc space-y-1 text-[var(--text)]">
          {technique.whenToUse.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Workflow">
        <ol className="space-y-2">
          {technique.workflow.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]"
                style={{ borderColor: "var(--border)" }}
              >
                {i + 1}
              </span>
              <div>
                <span className="font-medium">{step.label}</span>
                {step.detail && <p className="text-sm text-[var(--text-dim)]">{step.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Commands">
        <div className="space-y-5">
          {technique.commands.map((cmd, i) => (
            <div key={i} className="rounded-md border" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
                <code className="text-xs text-[var(--text-dim)]">{cmd.syntax}</code>
                <div className="flex shrink-0 gap-1.5">
                  {cmd.requiresRoot && <Badge tone="warn">root</Badge>}
                  {cmd.altersState && <Badge tone="danger">alters state</Badge>}
                </div>
              </div>
              <div className="flex items-start justify-between gap-2 px-3 py-2" style={{ background: "var(--code-bg)" }}>
                <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all text-[13px] text-[var(--accent)]">
                  {cmd.example}
                </pre>
                <CopyButton text={cmd.example} />
              </div>
              <div className="space-y-2 px-3 py-3 text-sm">
                <p>{cmd.description}</p>
                {cmd.flags && cmd.flags.length > 0 && (
                  <ul className="space-y-0.5 text-[var(--text-dim)]">
                    {cmd.flags.map((f, fi) => (
                      <li key={fi}>
                        <code className="text-[var(--text)]">{f.flag}</code> — {f.explanation}
                      </li>
                    ))}
                  </ul>
                )}
                <p>
                  <span className="text-[var(--text-faint)]">When to use: </span>
                  {cmd.whenToUse}
                </p>
                {cmd.expectedOutput && (
                  <div>
                    <p className="mb-1 text-[var(--text-faint)]">Expected output:</p>
                    <pre
                      className="overflow-x-auto whitespace-pre-wrap rounded p-2 text-[12px] text-[var(--text-dim)]"
                      style={{ background: "var(--code-bg)" }}
                    >
                      {cmd.expectedOutput}
                    </pre>
                  </div>
                )}
                {cmd.lookFor && (
                  <p>
                    <span className="text-[var(--text-faint)]">Look for: </span>
                    {cmd.lookFor}
                  </p>
                )}
                <p>
                  <span className="text-[var(--text-faint)]">Next step: </span>
                  {cmd.nextStep}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {technique.tools.length > 0 && (
        <Section title="Tools">
          <div className="space-y-4">
            {technique.tools.map((tool, i) => (
              <div key={i} className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-medium">{tool.name}</h3>
                <p className="mt-1 text-sm">{tool.purpose}</p>
                <p className="mt-1 text-sm">
                  <span className="text-[var(--text-faint)]">When to use: </span>
                  {tool.whenToUse}
                </p>
                {tool.install && (
                  <div className="mt-2 flex items-center gap-2">
                    <code
                      className="flex-1 overflow-x-auto rounded px-2 py-1 text-[12px]"
                      style={{ background: "var(--code-bg)" }}
                    >
                      {tool.install}
                    </code>
                    <CopyButton text={tool.install} />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <code
                    className="flex-1 overflow-x-auto rounded px-2 py-1 text-[12px]"
                    style={{ background: "var(--code-bg)" }}
                  >
                    {tool.usage}
                  </code>
                  <CopyButton text={tool.usage} />
                </div>
                {tool.options && tool.options.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-sm text-[var(--text-dim)]">
                    {tool.options.map((o, oi) => (
                      <li key={oi}>
                        <code className="text-[var(--text)]">{o.flag}</code> — {o.explanation}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-sm">
                  <span className="text-[var(--text-faint)]">Example workflow: </span>
                  {tool.exampleWorkflow}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Findings & Interpretation">
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1 font-medium text-[var(--ok)]">Interesting</p>
            <ul className="list-inside list-disc space-y-0.5">
              {technique.findings.interesting.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
          {technique.findings.suspicious && technique.findings.suspicious.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-[var(--warn)]">Suspicious</p>
              <ul className="list-inside list-disc space-y-0.5">
                {technique.findings.suspicious.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {technique.findings.falsePositives && technique.findings.falsePositives.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-[var(--danger)]">False Positives</p>
              <ul className="list-inside list-disc space-y-0.5">
                {technique.findings.falsePositives.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 font-medium text-[var(--text-dim)]">How to Validate</p>
            <ul className="list-inside list-disc space-y-0.5">
              {technique.findings.howToValidate.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Next Step">
        <ul className="list-inside list-disc space-y-1">
          {technique.nextStep.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3">
          {technique.troubleshooting.map((t, i) => (
            <details key={i} className="rounded-md border p-3" style={{ borderColor: "var(--border)" }}>
              <summary className="text-sm font-medium">{t.symptom}</summary>
              <div className="mt-2 space-y-1 text-sm text-[var(--text-dim)]">
                <p>
                  <span className="text-[var(--text-faint)]">Likely cause: </span>
                  {t.likelyCause}
                </p>
                <p>
                  <span className="text-[var(--text-faint)]">Verify: </span>
                  {t.verify}
                </p>
                <p>
                  <span className="text-[var(--text-faint)]">Fix: </span>
                  {t.fix}
                </p>
                <p>
                  <span className="text-[var(--text-faint)]">Recovery: </span>
                  {t.recovery}
                </p>
                <p>
                  <span className="text-[var(--text-faint)]">Avoid repeating: </span>
                  {t.avoid}
                </p>
              </div>
            </details>
          ))}
        </div>
      </Section>
    </article>
  );
}
