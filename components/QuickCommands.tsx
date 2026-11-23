import CopyButton from "./CopyButton";

const quick = [
  { label: "Full TCP port scan", cmd: "nmap -p- --min-rate=1000 -oN full-tcp.nmap TARGET_IP" },
  { label: "Default scripts + versions", cmd: "nmap -sC -sV TARGET_IP" },
  { label: "Directory brute-force", cmd: "gobuster dir -u TARGET_URL -w /usr/share/wordlists/dirb/common.txt" },
  { label: "SUID binaries", cmd: "find / -perm -4000 -type f 2>/dev/null" },
  { label: "Sudo permissions", cmd: "sudo -l" },
  { label: "Netcat listener", cmd: "nc -lvnp 4444" },
  { label: "File type check", cmd: "file FILE_PATH" },
  { label: "Metadata dump", cmd: "exiftool FILE_PATH" },
];

export default function QuickCommands() {
  return (
    <ul className="space-y-1.5">
      {quick.map((q) => (
        <li
          key={q.cmd}
          className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-[var(--bg-hover)]"
        >
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-faint)]">{q.label}</p>
            <code className="block truncate text-[12.5px] text-[var(--text)]">{q.cmd}</code>
          </div>
          <CopyButton text={q.cmd} />
        </li>
      ))}
    </ul>
  );
}
