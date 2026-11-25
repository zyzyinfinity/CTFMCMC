import Link from "next/link";
import WalkthroughStep from "@/components/WalkthroughStep";

export const metadata = { title: "File to Flag — Full Walkthrough — CTF Arsenal" };

export default function FileToFlag() {
  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-xs text-[var(--text-faint)]">DFIR</div>
      <h1 className="mb-3 text-2xl font-semibold">File to Flag — Full Walkthrough</h1>
      <p className="mb-8 text-sm text-[var(--text-dim)]">
        Day 2 is likely 1-2 standalone challenges with minimal or no description — you&apos;ll probably just get a
        file. This page teaches universal triage first, then walks one fully-worked chain (image steganography, the
        most common minimal-brief pattern) end to end, then condenses the branches to the other evidence types by
        linking to their existing pages rather than duplicating them.
      </p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Step 1 — Universal first moves (any artifact, before anything else)
      </h2>
      <div className="mb-6 space-y-5">
        <WalkthroughStep
          step="1.1"
          title="Identify the real file type"
          why="Identifies the real file type regardless of its extension — never trust the filename."
          command="file FILE_PATH"
          expectedOutput={"evidence.bin: JPEG image data, JFIF standard 1.01, 1920x1080\n(or: tcpdump capture file (little-endian) - version 2.4)"}
          next="Branch below based on what file reported."
        />
        <WalkthroughStep
          step="1.2"
          title="Hash it"
          why="Records an integrity hash for reference/chain-of-custody habit."
          command="sha256sum FILE_PATH"
          expectedOutput={"a1b2c3d4e5f6...  evidence.bin"}
          next="Record the hash in your notes, then continue."
        />
        <WalkthroughStep
          step="1.3"
          title="Check metadata"
          why="The flag is sometimes sitting directly in a metadata tag — check before anything fancy."
          command="exiftool FILE_PATH"
          expectedOutput={"Software                       : GIMP 2.10\nComment                         : flag{...}"}
          next="Flag found directly → done. Otherwise continue."
        />
        <WalkthroughStep
          step="1.4"
          title="Scan raw bytes for readable strings"
          why="Quick scan for obvious readable text, URLs, base64 blobs, or a flag string in the raw bytes."
          command="strings -n 8 FILE_PATH | less"
          expectedOutput={"http://10.10.11.5/update.php\nZmxhZ3t0aGlzX2lzX2Jhc2U2NH0=\n/home/user/.ssh/id_rsa"}
          next="Anything flag-shaped or base64-looking → decode it (CyberChef's Magic Wand, or base64 -d). Otherwise, branch below."
        />
      </div>

      <div className="mb-8 overflow-x-auto rounded-md border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
              <th className="px-3 py-2 font-medium">What `file` reported</th>
              <th className="px-3 py-2 font-medium">Go to</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Image data (JPEG/PNG/BMP/GIF)", "Full Image Steganography chain below"],
              ["tcpdump capture file / pcap", "Condensed Network chain below → pcap-triage-wireshark"],
              ["Raw/unusual binary, esp. named like a memory dump", "Condensed Memory chain below → volatility3-ram-triage"],
              ["Disk image (.dd/.img/.e01/.vmdk)", "Condensed Disk chain below → disk-image-triage-autopsy"],
              ["WAV/MP3/audio", "Condensed Audio chain below → audio-steganography"],
              [".eml/.msg", "Condensed Email chain below → email-header-phishing-analysis"],
              ["Plain text log", "Condensed Log chain below → linux-auth-log-analysis"],
              [".git/HEAD, .git/ directory, or a Git dump/bundle", "Condensed Git chain below → detect-exposed-git"],
              ["ZIP/RAR/7z archive (or wrong-extension archive)", "Condensed Archive chain below → identify-archive-type"],
              ["PDF or Office document (.docx/.xlsx/.pptx/.doc/.xls/.ppt)", "Condensed Document chain below → pdf-hidden-objects-attachments / office-ooxml-extraction"],
              ["Windows triage artifact (registry hive, .pf, .evtx, Amcache.hve, etc.)", "Condensed Windows chain below → registry-hive-analysis"],
              ["Unidentified binary, no recognisable signature", "Condensed File chain below → file-signature-magic-bytes"],
            ].map(([what, go]) => (
              <tr key={what} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-3 py-2">{what}</td>
                <td className="px-3 py-2 text-[var(--text-dim)]">{go}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Full worked chain: Image Steganography
      </h2>
      <div className="mb-8 space-y-5">
        <WalkthroughStep
          step="Step 2"
          title="Check for appended/embedded files"
          why="Images often have a second file (zip, another image) appended after the JPEG/PNG end marker."
          command="binwalk FILE_PATH"
          expectedOutput={"0         0x0        JPEG image data\n184320    0x2D000    Zip archive data, at least v2.0"}
          next="Second signature found → Step 3a. Nothing else found → Step 3b."
        />
        <WalkthroughStep
          step="Step 3a"
          title="Extract the embedded file"
          command="binwalk -e FILE_PATH"
          expectedOutput={"Creates _FILE_PATH.extracted/ containing the carved file(s)."}
          next="Run file on each extracted item; if one is readable text/the flag, done — otherwise also continue the stego chain on the original image, since both can apply."
        />
        <WalkthroughStep
          step="Step 3b"
          title="Try steghide"
          why="Needs a passphrase; JPEG mainly."
          command="steghide extract -sf FILE_PATH"
          expectedOutput={"Enter passphrase: (prompts)"}
          next="No known passphrase → Step 4."
        />
        <WalkthroughStep
          step="Step 4"
          title="Brute-force the passphrase"
          command="stegseek FILE_PATH /usr/share/wordlists/rockyou.txt"
          expectedOutput={'[i] Found passphrase: "letmein"\n[i] Original filename: "flag.txt".'}
          next="Fails, or file is PNG/BMP (steghide doesn't suit these) → Step 5."
        />
        <WalkthroughStep
          step="Step 5"
          title="Check LSB-hidden data"
          why="Covers PNG/BMP least-significant-bit steganography that steghide can't touch."
          command="zsteg FILE_PATH"
          expectedOutput={'b1,r,lsb,xy       .. text: "flag{...}"'}
          next="Still nothing → Step 6."
        />
        <WalkthroughStep
          step="Step 6"
          title="Manual visual inspection with StegSolve (GUI)"
          why="Catches visually-hidden content none of the automated tools flagged."
          next={
            <>
              Open the file in StegSolve, cycle through each color channel and bit-plane (0-7) and the XOR/Stereo
              views, looking for hidden text or a QR code. Found something → decode it (QR app, or paste text into
              CyberChef&apos;s Magic Wand if it looks encoded). Found nothing anywhere → re-check Step 1&apos;s
              exiftool/strings output for a missed clue, or reconsider whether <code>file</code> actually indicated a
              different artifact type than assumed — see{" "}
              <Link href="/b2r/when-the-playbook-doesnt-work" className="text-[var(--accent)] hover:underline">
                When the playbook doesn&apos;t work
              </Link>
              .
            </>
          }
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Condensed chains (link out, don&apos;t duplicate)
      </h2>
      <ul className="mb-8 list-inside list-disc space-y-2 text-sm">
        <li>
          <strong>Network:</strong> <code>tshark -r FILE_PATH -q -z io,phs</code> for a protocol overview first, then
          follow{" "}
          <Link href="/dfir/network-forensics/pcap-triage-wireshark" className="text-[var(--accent)] hover:underline">
            PCAP Triage with Wireshark
          </Link>{" "}
          /{" "}
          <Link href="/dfir/network-forensics/dns-exfiltration-analysis" className="text-[var(--accent)] hover:underline">
            DNS Exfiltration Analysis
          </Link>
          .
        </li>
        <li>
          <strong>Memory:</strong> <code>vol -f FILE_PATH windows.info</code> to confirm the OS/profile, then
          pslist → pstree → cmdline → netscan per{" "}
          <Link href="/dfir/memory-forensics/volatility3-ram-triage" className="text-[var(--accent)] hover:underline">
            Volatility 3 RAM Triage
          </Link>
          .
        </li>
        <li>
          <strong>Disk:</strong> <code>mmls</code> → <code>fls -o OFFSET -r</code> → <code>icat</code>/<code>istat</code>{" "}
          per{" "}
          <Link href="/dfir/disk-forensics/disk-image-triage-autopsy" className="text-[var(--accent)] hover:underline">
            Disk Image Triage with Autopsy
          </Link>
          .
        </li>
        <li>
          <strong>Audio:</strong> per the{" "}
          <Link href="/dfir/file-forensics/audio-steganography" className="text-[var(--accent)] hover:underline">
            Audio Steganography
          </Link>{" "}
          page.
        </li>
        <li>
          <strong>Email:</strong> per{" "}
          <Link href="/dfir/email-forensics/email-header-phishing-analysis" className="text-[var(--accent)] hover:underline">
            Email Header & Phishing Analysis
          </Link>
          .
        </li>
        <li>
          <strong>Log:</strong> per{" "}
          <Link href="/dfir/log-forensics/linux-auth-log-analysis" className="text-[var(--accent)] hover:underline">
            Linux Authentication Log Analysis
          </Link>
          .
        </li>
        <li>
          <strong>Git:</strong> <code>curl -s -o /dev/null -w &apos;%{"{"}http_code{"}"}&apos; URL/.git/HEAD</code> to
          confirm exposure, then{" "}
          <Link href="/dfir/git-forensics/detect-exposed-git" className="text-[var(--accent)] hover:underline">
            Git Forensics
          </Link>{" "}
          for dumping, full-history search, and recovering deleted/dangling commits.
        </li>
        <li>
          <strong>Archive:</strong> <code>file FILE_PATH</code> to confirm the real archive type regardless of
          extension, then{" "}
          <Link href="/dfir/archive-forensics/identify-archive-type" className="text-[var(--accent)] hover:underline">
            Archive Forensics
          </Link>{" "}
          for password cracking, known-plaintext attacks, and corrupted/split/nested archives.
        </li>
        <li>
          <strong>Document (PDF/Office):</strong> per{" "}
          <Link href="/dfir/document-forensics/pdf-hidden-objects-attachments" className="text-[var(--accent)] hover:underline">
            PDF Hidden Objects & Attachments
          </Link>{" "}
          or{" "}
          <Link href="/dfir/document-forensics/office-ooxml-extraction" className="text-[var(--accent)] hover:underline">
            DOCX/XLSX/PPTX XML Extraction
          </Link>
          , then VBA macro analysis if the file is macro-enabled.
        </li>
        <li>
          <strong>Unidentified binary:</strong> confirm there really is no recognisable signature with{" "}
          <Link href="/dfir/file-forensics/file-signature-magic-bytes" className="text-[var(--accent)] hover:underline">
            File Signature Identification & Magic Bytes
          </Link>{" "}
          before assuming it&apos;s a one-off format.
        </li>
        <li>
          <strong>Windows artifacts:</strong> per{" "}
          <Link href="/dfir/windows-artifacts/registry-hive-analysis" className="text-[var(--accent)] hover:underline">
            Windows Artifacts
          </Link>{" "}
          — registry hives, Prefetch, Amcache, Shimcache, Jump Lists/LNK, Recycle Bin, SRUM, ShellBags, scheduled
          tasks, RDP history.
        </li>
      </ul>

      <div className="rounded-md border p-4 text-sm" style={{ borderColor: "var(--border)" }}>
        <strong>CyberChef</strong> is the universal decode helper for any unknown-looking string found along the way
        (base64, hex, rot13, multi-layer encoding) — it&apos;s pre-installed on the pwnbox. Reach for its Magic Wand
        on anything that looks encoded before trying to decode it by hand.
      </div>
    </div>
  );
}
