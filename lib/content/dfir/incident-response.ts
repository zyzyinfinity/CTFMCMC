import { Technique } from "../types";

export const incidentResponseTechniques: Technique[] = [
  {
    slug: "ir-lifecycle-methodology",
    section: "dfir",
    category: "incident-response",
    title: "Incident Response Lifecycle",
    tags: ["incident response", "ir", "containment", "eradication", "ioc", "root cause", "preparation", "lessons learned"],
    concept:
      "Incident response follows a standard lifecycle — Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned — that applies equally to CTF DFIR challenges structured around a narrative incident. Each phase has a distinct goal; skipping ahead (e.g. eradicating before fully identifying scope) risks missing evidence or the attacker regaining access.",
    whenToUse: ["A DFIR challenge frames itself as a full incident narrative rather than a single artifact puzzle.", "You need a structure for writing up findings coherently."],
    workflow: [
      { label: "Preparation", detail: "What logging/tools/baselines existed before the incident (context given by the challenge)." },
      { label: "Identification", detail: "Confirm an incident occurred: what, when, how it was detected." },
      { label: "Containment", detail: "What stopped the spread/further damage (or should have)." },
      { label: "Eradication", detail: "Removing the attacker's access/tools/persistence." },
      { label: "Recovery", detail: "Restoring normal operation safely." },
      { label: "Lessons Learned", detail: "Root cause and how to prevent recurrence." },
    ],
    commands: [],
    tools: [
      {
        name: "A structured notes/timeline document",
        purpose: "Not a software tool — the single most important 'tool' in IR is a consistently maintained timeline and evidence log across every other technique used.",
        whenToUse: "From the very first artifact examined through to the final write-up.",
        usage: "Record: timestamp, artifact/source, finding, confidence, for every discovery across file/network/memory/disk/log forensics.",
        exampleWorkflow: "Every technique in this knowledge base feeds one shared timeline — maintain it as you go, not retroactively.",
      },
    ],
    findings: {
      interesting: ["A clear, single root cause (e.g. a phishing email leading to a specific host compromise leading to specific data accessed)"],
      suspicious: ["Gaps in the timeline where no evidence covers a window of time — call this out explicitly rather than assuming nothing happened"],
      falsePositives: ["Treating every anomaly as part of the incident — unrelated background noise (routine admin activity, scheduled jobs) is common and should be ruled out, not folded into the narrative"],
      howToValidate: ["Each lifecycle phase's conclusion should cite the specific artifact/technique that supports it — avoid narrative conclusions with no evidentiary anchor"],
    },
    nextStep: [
      "Identification: pull every IOC found across file/network/memory/log forensics into one list (hashes, IPs, domains, usernames, timestamps).",
      "Containment/Eradication: in a CTF this is usually a written answer (what should be blocked/removed), not a live action.",
      "Lessons Learned: state the specific root-cause vulnerability or misconfiguration the evidence points to.",
    ],
    troubleshooting: [
      {
        symptom: "Evidence points to multiple plausible root causes.",
        likelyCause: "Incomplete evidence coverage, or a genuinely multi-stage attack (e.g. phishing AND a separate vulnerable service).",
        verify: "Build the timeline fully before picking a root cause — check whether one cause is actually a prerequisite/consequence of the other.",
        fix: "State the most evidence-supported chain explicitly, and note remaining ambiguity rather than guessing a single clean answer.",
        recovery: "Re-examine artifacts for a definitive ordering (timestamps) between the candidate causes.",
        avoid: "Don't force a single tidy narrative if the evidence genuinely supports a multi-stage chain — accuracy over neatness.",
      },
    ],
  },
];
