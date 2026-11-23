import { Technique } from "../types";

export const emailForensicsTechniques: Technique[] = [
  {
    slug: "email-header-phishing-analysis",
    section: "dfir",
    category: "email-forensics",
    title: "Email Header Analysis & Phishing Detection",
    tags: ["email", "phishing", "spf", "dkim", "dmarc", "header", "spoofing", "eml"],
    concept:
      "Email headers record the actual delivery path (Received chain) and authentication results (SPF/DKIM/DMARC), which can confirm or contradict the claimed sender identity shown in the From field — the core of spotting spoofing and phishing.",
    whenToUse: ["Challenge provides a .eml file or raw email headers.", "Investigating a suspected phishing/spoofing incident."],
    workflow: [
      { label: "Extract the full raw header block", detail: "Not just the client's summary view." },
      { label: "Read the Received chain bottom-to-top", detail: "Reveals the true originating server." },
      { label: "Check SPF/DKIM/DMARC results", detail: "Pass/fail/none tells you if the domain was validated." },
      { label: "Inspect links/attachments separately and safely", detail: "Never open attachments directly; extract metadata/strings only." },
    ],
    commands: [
      {
        syntax: "cat FILE_PATH | head -50",
        example: "cat phishing.eml | head -50",
        description: "Views the raw header block of an .eml file as plain text.",
        flags: [],
        whenToUse: "First step — read headers as raw text rather than relying on a client's rendered 'From' display, which can be spoofed/misleading.",
        expectedOutput: "Received: from mail.attacker-infra.net ([203.0.113.9])\nFrom: \"IT Support\" <support@company.com>\nAuthentication-Results: spf=fail ...",
        lookFor: "Mismatch between the claimed From domain and the actual sending server in Received/Authentication-Results.",
        nextStep: "Trace the full Received chain and check each authentication result field.",
      },
      {
        syntax: "grep -i 'Authentication-Results' FILE_PATH",
        example: "grep -i 'Authentication-Results' phishing.eml",
        description: "Pulls out the receiving mail server's own SPF/DKIM/DMARC verdict for this message.",
        flags: [],
        whenToUse: "Quick check without manually reading the entire header block.",
        expectedOutput: "Authentication-Results: mx.company.com; spf=fail smtp.mailfrom=company.com; dkim=none; dmarc=fail",
        lookFor: "spf=fail/softfail, dkim=none/fail, dmarc=fail — any of these on a message claiming to be from a known domain is a strong spoofing indicator.",
        nextStep: "Cross-reference the IP in the Received header with the sender domain's actual published SPF record.",
      },
      {
        syntax: "grep -i 'Received:' FILE_PATH",
        example: "grep -i 'Received:' phishing.eml",
        description: "Extracts every hop in the delivery chain; read from the bottom entry upward for the true path from origin to your inbox.",
        flags: [],
        whenToUse: "To identify the true originating IP/server, which intermediate relays can obscure if read top-down.",
        expectedOutput: "Received: from [10.0.0.5] by mx.company.com\nReceived: from mail.attacker-infra.net ([203.0.113.9]) by relay1.net",
        lookFor: "The earliest (bottom) entry — that's the actual origin, often not matching the claimed sender's real infrastructure.",
        nextStep: "Look up the originating IP's reputation/ownership (offline/whois data if available) as supporting evidence.",
      },
    ],
    tools: [
      {
        name: "Thunderbird (View Source)",
        purpose: "Mail client that can display the complete raw header block for an .eml file.",
        whenToUse: "When a GUI view is preferable to grepping raw text.",
        usage: "Open the .eml, use 'View > Message Source' (or equivalent) to see raw headers.",
        exampleWorkflow: "Open file -> view source -> copy headers for detailed analysis.",
      },
      {
        name: "ExifTool",
        purpose: "Can extract metadata from any attachments (documents/images) without opening them in a vulnerable viewer.",
        whenToUse: "Investigating a malicious-looking attachment's authorship/origin metadata safely.",
        usage: "exiftool attachment.docx",
        exampleWorkflow: "Extract the attachment from the .eml, run exiftool rather than opening it directly.",
      },
    ],
    findings: {
      interesting: ["SPF/DKIM/DMARC failures on an email claiming to be from a trusted internal domain", "Originating IP geolocated/owned by infrastructure unrelated to the claimed sender"],
      suspicious: ["Reply-To address differing from the From address", "URL display text not matching its actual href target"],
      falsePositives: ["Legitimate bulk-mail senders sometimes show soft SPF failures due to third-party sending infrastructure — context (is this plausible for this org?) matters"],
      howToValidate: ["Confirm multiple independent indicators (auth results, Received chain, link mismatch) agree before concluding a message is malicious"],
    },
    nextStep: ["If a malicious URL/attachment is found, extract only its metadata/strings safely rather than opening it; feed any IOC into the Incident Response IOC-extraction step."],
    troubleshooting: [
      {
        symptom: "No Authentication-Results header present at all.",
        likelyCause: "The receiving server didn't perform or record SPF/DKIM/DMARC checks, or the header was stripped before you received the sample.",
        verify: "Check whether other authentication-related headers exist (Received-SPF, DKIM-Signature) as an alternate source.",
        fix: "Rely on the Received chain and sender-domain comparison manually if authentication headers are absent.",
        recovery: "Note the limitation explicitly in your findings rather than guessing a verdict.",
        avoid: "Don't assume absence of an auth header equals 'pass' — treat it as 'unknown', not a clean result.",
      },
    ],
  },
];
