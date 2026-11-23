// Shared content types for CTF Arsenal knowledge base.
// Content lives in lib/content/{b2r,dfir}/*.ts as plain data — no backend, no DB.

export type Section = "b2r" | "dfir";

export interface CommandEntry {
  /** Abstract syntax, e.g. "nmap -p- -sV TARGET_IP" */
  syntax: string;
  /** Concrete worked example with realistic values. */
  example: string;
  /** Plain-English description of what the command does. */
  description: string;
  /** Flag -> explanation. */
  flags?: { flag: string; explanation: string }[];
  /** When to reach for this specific command. */
  whenToUse: string;
  /** Representative expected output (illustrative, not guaranteed verbatim). */
  expectedOutput?: string;
  /** What to look for in that output. */
  lookFor?: string;
  /** What to do next based on the result. */
  nextStep: string;
  /** True if the command needs root/sudo. */
  requiresRoot?: boolean;
  /** True if running it can alter evidence/system state (DFIR) or target state (B2R). */
  altersState?: boolean;
}

export interface ToolEntry {
  name: string;
  purpose: string;
  whenToUse: string;
  /** Kali install command; omit if preinstalled on Kali. */
  install?: string;
  usage: string;
  options?: { flag: string; explanation: string }[];
  exampleWorkflow: string;
}

export interface TroubleshootingEntry {
  symptom: string;
  likelyCause: string;
  verify: string;
  fix: string;
  recovery: string;
  avoid: string;
}

export interface FlowStep {
  label: string;
  detail?: string;
}

export interface Technique {
  slug: string;
  section: Section;
  /** Category slug, must match a CategoryMeta key for the section. */
  category: string;
  title: string;
  /** Tags used for search matching (tools, CVEs, protocols, extensions...). */
  tags: string[];
  concept: string;
  whenToUse: string[];
  workflow: FlowStep[];
  commands: CommandEntry[];
  tools: ToolEntry[];
  findings: {
    interesting: string[];
    suspicious?: string[];
    falsePositives?: string[];
    howToValidate: string[];
    /** Per-port quick-reference notes (port/service -> what to check/try). */
    portNotes?: { port: string; note: string }[];
  };
  nextStep: string[];
  troubleshooting: TroubleshootingEntry[];
}

export interface MistakeEntry {
  slug: string;
  section: Section;
  title: string;
  tags: string[];
  symptom: string;
  likelyCause: string;
  verify: string;
  correctCommand: string;
  recovery: string;
  avoid: string;
}

export interface CategoryMeta {
  slug: string;
  title: string;
  description: string;
}
