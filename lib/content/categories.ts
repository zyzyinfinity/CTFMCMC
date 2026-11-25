import { CategoryMeta, Section } from "./types";

export const b2rCategories: CategoryMeta[] = [
  { slug: "enumeration", title: "1. Information Gathering & Enumeration", description: "Host discovery, port/service scanning, and surface mapping." },
  { slug: "web-exploitation", title: "2. Web Exploitation", description: "LFI/RFI, injection, upload abuse, and CMS/app-layer attacks." },
  { slug: "initial-access", title: "3. Initial Access & Foothold", description: "Turning a vulnerability into a shell, and stabilizing it." },
  { slug: "privesc-linux", title: "4. Linux Privilege Escalation", description: "SUID/SGID, sudo, cron, capabilities, kernel, and more." },
  { slug: "privesc-windows", title: "5. Windows Privilege Escalation", description: "Token privileges, service/registry misconfig, AlwaysInstallElevated, scheduled tasks, and credential hunting." },
  { slug: "credential-attacks", title: "6. Password & Credential Attacks", description: "Hash identification, cracking, and credential reuse." },
  { slug: "other-b2r", title: "7. Other B2R Topics", description: "FTP/SMB/DB exploitation, pivoting, Docker, Windows basics." },
];

export const dfirCategories: CategoryMeta[] = [
  { slug: "file-forensics", title: "Image & File Forensics", description: "Metadata, magic bytes, carving, and steganography." },
  { slug: "network-forensics", title: "Network Forensics", description: "PCAP analysis, protocol reconstruction, exfiltration." },
  { slug: "malware-forensics", title: "Malware Forensics", description: "Safe static and dynamic analysis, IOCs, YARA." },
  { slug: "memory-forensics", title: "Memory Forensics", description: "RAM image triage with Volatility 3." },
  { slug: "disk-forensics", title: "Disk & Filesystem Forensics", description: "Disk images, deleted file recovery, filesystem artifacts." },
  { slug: "email-forensics", title: "Email Forensics", description: "Headers, spoofing, phishing indicators." },
  { slug: "log-forensics", title: "Log & Timeline Forensics", description: "Auth logs, Windows events, timeline correlation." },
  { slug: "archive-forensics", title: "Archive Forensics", description: "Archive ID by magic bytes, ZIP/RAR/7z password cracking, known-plaintext attacks, corrupted/split archives." },
  { slug: "encoding", title: "Encoding & Decoding", description: "Base64/32/58/85, hex, XOR, compression, zero-width and whitespace stego, CyberChef." },
  { slug: "windows-artifacts", title: "Windows Artifacts", description: "Registry hives, Prefetch, Amcache, Shimcache, Jump Lists, LNK, Recycle Bin, SRUM, ShellBags, scheduled tasks, RDP history." },
  { slug: "document-forensics", title: "Document Forensics", description: "PDF/Office hidden objects, streams, redaction bypass, OOXML XML extraction, VBA macros, hidden sheets, embedded OLE objects." },
  { slug: "git-forensics", title: "Git Forensics", description: "Exposed .git recovery, full-history search, deleted-file recovery, dangling objects, tags/stashes, manual object retrieval." },
  { slug: "incident-response", title: "Incident Response", description: "The IR lifecycle: prep through lessons learned." },
];

export function categoriesFor(section: Section): CategoryMeta[] {
  return section === "b2r" ? b2rCategories : dfirCategories;
}
