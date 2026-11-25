import { CommandEntry, Technique } from "../types";

interface Entry {
  slug: string;
  title: string;
  tags: string[];
  task: string;
  cmds: (Pick<CommandEntry, "syntax" | "example" | "description"> & { lookFor: string })[];
  gotcha: string;
  gotchaFix: string;
  next: string;
}

function entry(e: Entry): Technique {
  return {
    slug: e.slug,
    section: "dfir",
    category: "archive-forensics",
    title: e.title,
    tags: ["archive", "zip", "compression", ...e.tags],
    concept: e.task,
    whenToUse: [e.task],
    workflow: [{ label: "Run the command, then re-check with `file` / `unzip -l` whether the layer is actually open" }],
    commands: e.cmds.map((c) => ({
      ...c,
      whenToUse: e.task,
      nextStep: e.next,
    })),
    tools: [],
    findings: {
      interesting: e.cmds.map((c) => c.lookFor),
      howToValidate: ["Re-run `file` / `unzip -l` / `7z l` on the result; a listed file table or a known magic number confirms success."],
    },
    nextStep: [e.next],
    troubleshooting: [
      {
        symptom: `Gotcha: ${e.gotcha}`,
        likelyCause: e.gotcha,
        verify: "Re-check the archive type and encryption method before assuming the command failed.",
        fix: e.gotchaFix,
        recovery: "Re-run against the original archive, not a partially-extracted copy.",
        avoid: e.gotchaFix,
      },
    ],
  };
}

export const archiveForensicsTechniques: Technique[] = [
  entry({
    slug: "identify-archive-type",
    title: "Identify Archive Type Despite Wrong Extension",
    tags: ["magic bytes", "file", "zip", "rar", "7z", "extension"],
    task: "Identify the real archive format when the extension is missing or wrong.",
    cmds: [
      {
        syntax: "file FILE_PATH; xxd -l 16 FILE_PATH",
        example: "file archive.bin; xxd -l 16 archive.bin",
        description:
          "Shows the detected type, then the first 16 bytes to confirm by magic number. ZIP = 50 4B 03 04 (local file header; an empty ZIP uses 50 4B 05 06). RAR (v1.5–4.x) = 52 61 72 21 1A 07 00. RAR5 = 52 61 72 21 1A 07 01 00 (one byte longer than RAR4 — don't confuse the two). 7z = 37 7A BC AF 27 1C. gzip = 1F 8B. tar has no fixed header magic — check for \"ustar\" at offset 257.",
        lookFor: "A magic number matching one of the above, regardless of what the file is named or what `file` guessed from the extension.",
      },
    ],
    gotcha: "RAR4 and RAR5 signatures differ only by one trailing byte (...07 00 vs ...07 01 00); mixing them up picks the wrong unpacker / john hash mode.",
    gotchaFix: "Compare the full signature length, not just the first 5 bytes — RAR5 needs `rar2john --rar5` / unrar supporting RAR5 (newer unrar/7z builds do).",
    next: "Rename with the correct extension (optional) and open with the matching tool from this page.",
  }),
  entry({
    slug: "zip-password-cracking",
    title: "Password-Protected ZIP Cracking",
    tags: ["zip2john", "john", "fcrackzip", "rockyou", "wordlist", "bruteforce"],
    task: "Recover the password on an encrypted ZIP.",
    cmds: [
      {
        syntax: "zip2john FILE_PATH > hash.txt && john --wordlist=WORDLIST_PATH hash.txt",
        example: "zip2john archive.zip > hash.txt && john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt",
        description: "Extracts a crackable hash from the ZIP, then runs a wordlist attack. Fast if the password is weak/in rockyou. Show it with `john --show hash.txt`.",
        lookFor: "A cracked password printed inline, or confirmed with `john --show hash.txt`.",
      },
      {
        syntax: "fcrackzip -u -D -p WORDLIST_PATH FILE_PATH",
        example: "fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt archive.zip",
        description: "Dictionary attack (-D) against legacy ZipCrypto, unzipping (-u) to verify each candidate against the real file contents instead of just the CRC.",
        lookFor: "A line like \"PASSWORD FOUND!!!!: pw == <password>\".",
      },
    ],
    gotcha: "fcrackzip only attacks legacy ZipCrypto; it silently fails or never finds anything against AES-encrypted ZIPs (WinZip AES / 7-Zip AES).",
    gotchaFix: "Check the method first: `zipinfo -v archive.zip` or `7z l -slt archive.zip` shows \"AES\" vs \"ZipCrypto\" / \"Deflate\". AES needs the real password — rely on zip2john+john with a stronger wordlist/rules, not fcrackzip.",
    next: "If weak-password attacks fail and it's ZipCrypto, try the known-plaintext attack (bkcrack) instead of brute force.",
  }),
  entry({
    slug: "zip-known-plaintext-bkcrack",
    title: "Known-Plaintext Attack on ZIP (bkcrack)",
    tags: ["bkcrack", "zipcrypto", "known plaintext", "crib", "keystream"],
    task: "Recover ZipCrypto internal keys (not the password) using ~12+ known contiguous bytes of one file inside the archive, then unlock the archive with a new password.",
    cmds: [
      {
        syntax: "bkcrack -C ENCRYPTED.zip -c PLAIN_ENTRY_NAME -P PLAINTEXT.zip -p PLAIN_ENTRY_NAME",
        example: "bkcrack -C encrypted.zip -c secret.txt -P plain.zip -p secret.txt",
        description: "Uses a full plaintext copy of one archived file (e.g. from another release of the same file) to recover the internal cipher keys.",
        lookFor: "\"Keys: <k0> <k1> <k2>\" printed once enough known bytes have been checked.",
      },
      {
        syntax: "bkcrack -C ENCRYPTED.zip -c TARGET_ENTRY -x OFFSET HEX_MAGIC_BYTES",
        example: "bkcrack -C encrypted.zip -c flag.png -x 0 89504E470D0A1A0A0000000D49484452",
        description: "Alternative when only the file's magic header is known (no full plaintext copy) — e.g. a PNG signature + IHDR start at offset 0.",
        lookFor: "Same \"Keys: ...\" output; needs ~12+ known bytes minimum (more reduces false positives).",
      },
      {
        syntax: "bkcrack -C ENCRYPTED.zip -k K0 K1 K2 -U OUT.zip NEW_PASSWORD",
        example: "bkcrack -C encrypted.zip -k 12345678 87654321 abcdef01 -U cracked.zip newpass",
        description: "Once the 3 internal keys are recovered, decrypts the whole archive and re-encrypts it with a password you choose.",
        lookFor: "cracked.zip opens with NEW_PASSWORD and extracts normally.",
      },
    ],
    gotcha: "bkcrack only works on legacy ZipCrypto. AES-encrypted ZIPs have no exploitable keystream — there is no shortcut, you need the real password.",
    gotchaFix: "Confirm the method first with `zipinfo -v`/`7z l -slt` before spending time on bkcrack; for AES fall back to wordlist/rule-based john/hashcat cracking.",
    next: "Open cracked.zip with the chosen new password and extract normally.",
  }),
  entry({
    slug: "rar-7z-password-cracking",
    title: "Password-Protected RAR / 7z Cracking",
    tags: ["rar2john", "7z2john", "john", "rockyou", "rar", "7z"],
    task: "Recover the password on an encrypted RAR or 7z archive.",
    cmds: [
      {
        syntax: "rar2john FILE_PATH > hash.txt && john --wordlist=WORDLIST_PATH hash.txt",
        example: "rar2john archive.rar > hash.txt && john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt",
        description: "Extracts a John-compatible hash from the RAR and runs a wordlist attack. From the john-jumbo package (`apt install john`).",
        lookFor: "A cracked password, confirmed with `john --show hash.txt`.",
      },
      {
        syntax: "7z2john.pl FILE_PATH > hash.txt && john --wordlist=WORDLIST_PATH hash.txt",
        example: "7z2john.pl archive.7z > hash.txt && john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt",
        description: "Same approach for 7z archives. The script ships with john-jumbo under its run/ directory.",
        lookFor: "A cracked password, confirmed with `john --show hash.txt`.",
      },
    ],
    gotcha: "RAR encrypts filenames differently by version (RAR4 vs RAR5) and sometimes only encrypts data, not the file list — rar2john needs the right RAR version to even produce a usable hash.",
    gotchaFix: "If rar2john errors or produces no hash, confirm RAR version from the magic bytes (see Identify Archive Type) and check for an updated rar2john/john-jumbo build.",
    next: "Extract the archive with the recovered password and continue triage on its contents.",
  }),
  entry({
    slug: "nested-archives",
    title: "Nested Archives",
    tags: ["recursive", "nested", "unzip", "extension mismatch", "find"],
    task: "Recursively unpack archives nested inside other archives, including ones hidden behind a wrong extension.",
    cmds: [
      {
        syntax: "for f in $(find . -name '*.zip'); do unzip -o \"$f\" -d \"${f%.zip}_ext\"; done",
        example: "for f in $(find . -name '*.zip'); do unzip -o \"$f\" -d \"${f%.zip}_ext\"; done",
        description: "Extracts every .zip found so far into a sibling _ext directory, overwriting (-o) on repeat runs. Re-run after each layer surfaces new .zip files, or adapt the -name pattern per layer (*.gz, *.tar, *.rar, *.7z).",
        lookFor: "New directories/files appearing after each pass; stop once a pass finds nothing new.",
      },
      {
        syntax: "find . -type f -exec file {} \\;",
        example: "find . -type f -exec file {} \\;",
        description: "Runs `file` on every extracted item, not just ones with an archive-looking name.",
        lookFor: "Any item whose detected type disagrees with its extension (e.g. a '.jpg' that `file` reports as a Zip archive).",
      },
    ],
    gotcha: "Relying on filename extensions to drive the loop misses archives that were deliberately renamed (e.g. secret.zip saved as secret.jpg).",
    gotchaFix: "After each extraction pass, run `file` on every item regardless of name, and feed anything that's actually an archive back into the extraction loop.",
    next: "Once no new archive is found and every `file` result matches a final data type (image, text, binary), move on to that file's own forensics page.",
  }),
  entry({
    slug: "corrupted-archive-recovery",
    title: "Corrupted Archive Recovery",
    tags: ["eocd", "repair", "fix", "unrar", "central directory"],
    task: "Repair a ZIP or RAR whose central directory / end record is damaged or truncated.",
    cmds: [
      {
        syntax: "zip -FF BROKEN.zip --out FIXED.zip",
        example: "zip -FF broken.zip --out fixed.zip",
        description: "Info-ZIP's aggressive fix mode: rescans the whole file for local file headers and rebuilds the central directory from scratch (plain `-F` only tries to patch the existing central directory).",
        lookFor: "\"Fix archive (-FF)\" output ending in a rebuilt central directory; `unzip -l fixed.zip` then lists the files.",
      },
      {
        syntax: "unrar rc BROKEN.rar",
        example: "unrar rc broken.rar",
        description: "Reconstructs a RAR archive from an accompanying .rev recovery record, if one was created alongside it.",
        lookFor: "A rebuilt, extractable .rar; fails outright if no .rev recovery record exists.",
      },
      {
        syntax: "grep for EOCD signature 50 4B 05 06 near end of file",
        example: "python3 -c \"d=open('broken.zip','rb').read();print(d.rfind(b'PK\\x05\\x06'))\"",
        description: "Locates the End Of Central Directory record by its signature bytes (PK\\x05\\x06) when it's present but the tool won't parse it; compare against the expected EOCD layout to manually patch truncated/incorrect fields (central dir offset/size, entry count).",
        lookFor: "A found offset near the very end of the file; -1 means the EOCD itself is missing/truncated and must be rebuilt from local file headers instead.",
      },
    ],
    gotcha: "`zip -F`/`-FF` modifies in place unless you pass `--out`; always write to a new file so the original damaged evidence copy is preserved.",
    gotchaFix: "Always use `--out FIXED.zip` (or work on a copy) — never run `-FF` directly on the only copy of evidence.",
    next: "Extract the fixed/reconstructed archive and verify file counts/CRCs match what the challenge expects.",
  }),
  entry({
    slug: "split-archive-reconstruction",
    title: "Split Archive Reconstruction",
    tags: ["split", "multipart", "volumes", "7z", "cat"],
    task: "Recombine a multi-volume split archive before extracting.",
    cmds: [
      {
        syntax: "cat ARCHIVE.zip.001 ARCHIVE.zip.002 ... > full.zip",
        example: "cat archive.zip.001 archive.zip.002 archive.zip.003 > full.zip",
        description: "Plain ZIP split parts are just a raw byte split — concatenating them in numeric order (shell globbing with a zero-padded pattern, e.g. `archive.zip.0*`, sorts correctly) reconstructs the original file exactly.",
        lookFor: "`unzip -l full.zip` lists files with no CRC errors.",
      },
      {
        syntax: "7z x ARCHIVE.7z.001",
        example: "7z x archive.7z.001",
        description: "7-Zip's own multi-volume format: extracting the first .001 part auto-locates and reads the rest (.002, .003, ...) as long as they're named consistently and in the same directory.",
        lookFor: "Normal extraction output with no \"missing volume\" errors.",
      },
    ],
    gotcha: "Concatenating parts out of numeric order (e.g. shell globbing without zero-padding sorts .zip.2 before .zip.10) silently produces a corrupt file that still looks plausible.",
    gotchaFix: "Explicitly list parts in order, or confirm the glob sorts correctly (`ls archive.zip.* | sort -V`) before piping into `cat`.",
    next: "Run `file`/`unzip -l` on the reconstructed archive to confirm it's intact before extracting.",
  }),
  entry({
    slug: "zip-metadata-comments",
    title: "ZIP Metadata & Comments",
    tags: ["unzip -v", "zipinfo", "crc", "comment", "eocd", "strings"],
    task: "Inspect per-file metadata and any hidden archive-level comment in a ZIP.",
    cmds: [
      {
        syntax: "unzip -v FILE_PATH",
        example: "unzip -v archive.zip",
        description: "Lists every entry's compression method, size, ratio, date/time and CRC-32 without extracting anything.",
        lookFor: "An entry with an unusual method (e.g. \"Stored\" hiding something uncompressed) or a CRC worth cross-checking against a known-good file.",
      },
      {
        syntax: "zipinfo -v FILE_PATH",
        example: "zipinfo -v archive.zip",
        description: "Full verbose metadata dump per entry plus the end-of-central-directory record summary — more detail than `unzip -v`.",
        lookFor: "Per-entry comments, extra fields, or an \"there is a zipfile comment\" / \"there is no zipfile comment\" line.",
      },
      {
        syntax: "strings FILE_PATH | tail",
        example: "strings archive.zip | tail -5",
        description: "The global archive comment sits after the EOCD record at the very end of the file (ZIP's comment field is plain text appended last) — `strings ... | tail` surfaces it even when zipinfo doesn't flag one.",
        lookFor: "Readable text after the last filename/CRC noise — a comment, a flag, or a hint left by the challenge author.",
      },
    ],
    gotcha: "A ZIP archive comment is separate from per-file comments; `unzip -v` only shows the latter, so a global comment can be missed if you stop there.",
    gotchaFix: "Always also check `zipinfo -v` (reports whether an archive comment exists) and `strings ... | tail` to actually read it.",
    next: "If a comment/CRC points to a specific entry, extract just that entry and continue analysis on it.",
  }),
  entry({
    slug: "recursive-decompression-binwalk",
    title: "Recursive Decompression Helper (binwalk)",
    tags: ["binwalk", "extract", "auto", "recursive", "triage"],
    task: "Blind first-pass extraction of layered/embedded archives and compressed blobs before manual work.",
    cmds: [
      {
        syntax: "binwalk -e FILE_PATH",
        example: "binwalk -e file",
        description: "Scans for known file signatures anywhere in the blob and auto-extracts everything it recognizes (gzip, zip, tar, filesystems, executables...) into a `_file.extracted` directory, recursing into what it finds.",
        lookFor: "A populated `_file.extracted/` directory; check it with `find _file.extracted -type f -exec file {} \\;` same as nested-archive triage.",
      },
    ],
    gotcha: "binwalk's auto-extraction can miss password-protected or oddly-structured archives, and recursing blindly can explode into huge nested output on crafted/decompression-bomb-style files.",
    gotchaFix: "Treat binwalk as a fast first pass, not the final answer — fall back to the manual commands on this page for anything it doesn't crack, and watch extracted output size.",
    next: "Review everything under the _extracted directory with `file`, and manually handle anything binwalk couldn't open.",
  }),
];
