import { Technique } from "../types";

export const otherB2rTechniques: Technique[] = [
  {
    slug: "ftp-exploitation",
    section: "b2r",
    category: "other-b2r",
    title: "FTP Exploitation & Enumeration",
    tags: ["ftp", "anonymous login", "21", "vsftpd", "credential"],
    concept:
      "FTP (port 21) is checked for anonymous access and version-specific vulnerabilities. Anonymous FTP often exposes files directly useful for a foothold (credentials, source code, or a writable directory for upload-based access).",
    whenToUse: ["Port 21 open during nmap scan."],
    workflow: [
      { label: "Test anonymous login", detail: "Username anonymous, any password/blank." },
      { label: "List and download all accessible files", detail: "Recursively if directories exist." },
      { label: "Check for a writable directory", detail: "Potential upload path if FTP root overlaps a web root." },
      { label: "Check banner/version for known CVEs", detail: "e.g. vsftpd 2.3.4 backdoor." },
    ],
    commands: [
      {
        syntax: "ftp TARGET_IP",
        example: "ftp 10.10.11.25",
        description: "Connects interactively; try 'anonymous' as username with any/blank password.",
        flags: [],
        whenToUse: "First manual test against any open FTP port.",
        expectedOutput: "230 Login successful.",
        lookFor: "Successful login as anonymous.",
        nextStep: "ls to list files, get FILE_PATH to download, put FILE_PATH to test write access.",
      },
      {
        syntax: "wget -r ftp://anonymous:anonymous@TARGET_IP/",
        example: "wget -r ftp://anonymous:anonymous@10.10.11.25/",
        description: "Recursively mirrors the entire accessible FTP tree to your local machine for offline review.",
        flags: [{ flag: "-r", explanation: "Recursive download." }],
        whenToUse: "Once anonymous access is confirmed and there's more than a couple of files to review.",
        expectedOutput: "Downloaded files into a directory named after the target IP.",
        lookFor: "Any config, script, or document files among the mirrored content.",
        nextStep: "grep -r 'password' on the mirrored directory.",
      },
    ],
    tools: [
      {
        name: "nmap (ftp-anon script)",
        purpose: "Automated anonymous-login check.",
        whenToUse: "As part of the initial service scan.",
        usage: "nmap --script ftp-anon -p 21 TARGET_IP",
        exampleWorkflow: "Run alongside the main nmap scan to confirm anonymous access without a manual connection.",
      },
    ],
    findings: {
      interesting: ["Credentials or SSH keys left in an FTP-accessible directory", "Writable directory reachable also via HTTP (web root overlap)"],
      falsePositives: ["Anonymous login succeeding with zero listable files is a dead end, not a vulnerability by itself"],
      howToValidate: ["Confirm write access actually persists a file (upload then re-list) before relying on it for a foothold"],
    },
    nextStep: ["If writable and web-exposed, upload a webshell/payload for RCE."],
    troubleshooting: [
      {
        symptom: "Connection refused on port 21.",
        likelyCause: "Service only listens on a specific interface, or firewall rules restrict access.",
        verify: "Re-confirm with nmap -p21 -sV TARGET_IP that the port is genuinely open from your current network path.",
        fix: "Re-check VPN connectivity; some FTP services use passive mode which can be blocked separately from the control port.",
        recovery: "Try ftp in passive mode explicitly, or use lftp as an alternative client.",
        avoid: "Confirm port state with a fresh scan before troubleshooting the client.",
      },
    ],
  },
  {
    slug: "database-exploitation",
    section: "b2r",
    category: "other-b2r",
    title: "Exposed Database Exploitation",
    tags: ["mysql", "redis", "mongodb", "database", "3306", "6379", "27017", "no auth"],
    concept:
      "Databases exposed directly to the network (MySQL 3306, Redis 6379, MongoDB 27017) sometimes allow unauthenticated or default-credential access, leaking application data or, for Redis, enabling file write for RCE via known techniques.",
    whenToUse: ["Database ports found open during port scanning."],
    workflow: [
      { label: "Test unauthenticated/default-credential access", detail: "Each DB engine has its own defaults." },
      { label: "Enumerate databases/tables/keys", detail: "Pull application data." },
      { label: "Check for write-based RCE primitives", detail: "e.g. Redis module load / cron write." },
    ],
    commands: [
      {
        syntax: "mysql -h TARGET_IP -u root",
        example: "mysql -h 10.10.11.25 -u root",
        description: "Attempts to connect to a remote MySQL server as root with no password.",
        flags: [{ flag: "-h", explanation: "Remote host." }],
        whenToUse: "First test when 3306 is open and reachable.",
        expectedOutput: "mysql> (prompt, connected)",
        lookFor: "Successful connection without a password.",
        nextStep: "SHOW DATABASES; then SELECT * FROM users; on an application database.",
      },
      {
        syntax: "redis-cli -h TARGET_IP",
        example: "redis-cli -h 10.10.11.25",
        description: "Connects to a Redis instance; many CTF/misconfigured Redis servers require no authentication at all.",
        flags: [],
        whenToUse: "When 6379 is open.",
        expectedOutput: "10.10.11.25:6379> (prompt)",
        lookFor: "INFO command succeeding without AUTH — confirms no password is set.",
        nextStep: "Use CONFIG GET dir / CONFIG SET dir to attempt writing a file (e.g. an SSH authorized_keys entry) if the target permits it.",
      },
    ],
    tools: [
      {
        name: "mysql client",
        purpose: "Interactive MySQL/MariaDB client.",
        whenToUse: "Default tool once credentials or no-auth access is confirmed.",
        install: "sudo apt install mysql-client",
        usage: "mysql -h HOST -u USER -p",
        exampleWorkflow: "Connect -> SHOW DATABASES -> USE db -> SELECT * FROM users.",
      },
    ],
    findings: {
      interesting: ["Application credentials stored in plaintext in a users table", "Writable Redis instance allowing SSH key injection"],
      falsePositives: ["A database requiring auth with no known default creds is not a vulnerability by itself — don't force-crack without justification"],
      howToValidate: ["Confirm any extracted credential works against the actual associated service, not just the DB session"],
    },
    nextStep: ["Crack extracted password hashes; try credentials against SSH/web login."],
    troubleshooting: [
      {
        symptom: "mysql client: 'ERROR 2003: Can't connect'.",
        likelyCause: "Port filtered, or MySQL bound to localhost only despite nmap showing it open (nmap can show the port open on the host without the service accepting remote connections at the application layer).",
        verify: "Re-run nmap -sV -p3306 to confirm the service banner responded, not just the TCP handshake.",
        fix: "This may be a genuine dead end for direct access — look for SSRF/local-only access via a web app instead.",
        recovery: "Pivot: see if an app on the box can be made to query the DB on your behalf (e.g. via SQLi).",
        avoid: "Don't assume an open port always equals remotely usable application access.",
      },
    ],
  },
];
