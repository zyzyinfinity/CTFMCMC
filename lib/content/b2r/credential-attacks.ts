import { Technique } from "../types";

export const credentialAttacksTechniques: Technique[] = [
  {
    slug: "hash-identification-cracking",
    section: "b2r",
    category: "credential-attacks",
    title: "Hash Identification & Cracking",
    tags: ["hash", "john", "hashcat", "hashid", "rockyou", "md5", "sha1", "ntlm", "bcrypt", "cracking"],
    concept:
      "Cracking recovers a plaintext password from its hash by guessing candidates (wordlist or brute-force) and comparing hash outputs. The hash format must be identified correctly first, since John/Hashcat need to know which algorithm to apply.",
    whenToUse: [
      "You've extracted a password hash from a database dump, /etc/shadow, a config file, or a file's metadata.",
    ],
    workflow: [
      { label: "Identify the hash format", detail: "Length, prefix, charset give strong hints." },
      { label: "Choose wordlist and tool", detail: "rockyou.txt is the default CTF wordlist." },
      { label: "Run the cracking tool", detail: "John for CPU/varied formats, Hashcat for GPU speed." },
      { label: "Validate the recovered password", detail: "Try it against the actual service (SSH, login form)." },
    ],
    commands: [
      {
        syntax: "hashid 'HASH_VALUE'",
        example: "hashid '5f4dcc3b5aa765d61d8327deb882cf99'",
        description: "Guesses possible hash algorithms based on length/format.",
        flags: [],
        whenToUse: "First step when you don't know what type of hash you have.",
        expectedOutput: "[+] MD5\n[+] MD4\n[+] NTLM",
        lookFor: "Multiple candidates are normal for short hex hashes — context (source system) narrows it down.",
        nextStep: "Pick the most contextually likely format and attempt a crack.",
      },
      {
        syntax: "john --wordlist=FILE_PATH HASH_FILE",
        example: "john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt",
        description: "Runs John the Ripper against the hash file using the given wordlist.",
        flags: [{ flag: "--wordlist=", explanation: "Path to the wordlist to try." }],
        whenToUse: "Default cracking attempt for most CTF hash formats (John auto-detects many formats from the hash string itself).",
        expectedOutput: "password123     (user)",
        lookFor: "A cracked line showing the plaintext next to the username/hash.",
        nextStep: "Use john --show hash.txt to re-display cracked results later.",
      },
      {
        syntax: "hashcat -m MODE -a 0 HASH_FILE FILE_PATH",
        example: "hashcat -m 0 -a 0 hash.txt /usr/share/wordlists/rockyou.txt",
        description: "Runs Hashcat in wordlist-attack mode against the given hash file using the GPU (much faster than John for large jobs).",
        flags: [
          { flag: "-m MODE", explanation: "Hash-type mode number (e.g. 0 = MD5, 1000 = NTLM, 1800 = sha512crypt). Look up the exact mode for your format." },
          { flag: "-a 0", explanation: "Attack mode 0 = straight wordlist attack." },
        ],
        whenToUse: "When John is too slow, or a GPU is available and the job is large.",
        expectedOutput: "5f4dcc3b5aa765d61d8327deb882cf99:password",
        lookFor: "hash:plaintext pairs in the output / hashcat -m MODE hash.txt --show.",
        nextStep: "Try the recovered password against the relevant service/account.",
      },
      {
        syntax: "zip2john FILE_PATH > hash.txt / ssh2john FILE_PATH > hash.txt",
        example: "ssh2john id_rsa > hash.txt",
        description: "Converts a protected file format (zip, ssh key, etc.) into a John-crackable hash representation.",
        flags: [],
        whenToUse: "When you have a password-protected archive or an encrypted SSH private key, not a raw hash.",
        expectedOutput: "id_rsa:$sshng$1$...",
        lookFor: "A valid hash line produced; then feed it to john normally.",
        nextStep: "john --wordlist=rockyou.txt hash.txt, then use the cracked passphrase to decrypt the key.",
      },
    ],
    tools: [
      {
        name: "John the Ripper",
        purpose: "Versatile offline password cracker supporting many hash/file formats via *2john helper scripts.",
        whenToUse: "Default first choice; broad format support, CPU-based.",
        install: "sudo apt install john",
        usage: "john --wordlist=WORDLIST hash.txt",
        exampleWorkflow: "Convert file to hash with *2john -> crack with rockyou -> john --show to view.",
      },
      {
        name: "Hashcat",
        purpose: "GPU-accelerated password cracker; much faster at scale.",
        whenToUse: "Large hash sets, slow algorithms (bcrypt), or when you need rule-based/mask attacks.",
        install: "sudo apt install hashcat",
        usage: "hashcat -m MODE -a 0 hash.txt wordlist.txt",
        exampleWorkflow: "Identify mode number -> wordlist attack -> fall back to rule-based attack (-r rules/best64.rule) if plain wordlist fails.",
      },
    ],
    findings: {
      interesting: ["Weak/common passwords cracking instantly against rockyou", "Reused passwords across multiple services found during the same engagement"],
      falsePositives: ["A hash that never cracks against rockyou isn't proof the password is 'unguessable' — try rule-based mutations before giving up"],
      howToValidate: ["Always confirm a 'cracked' password actually authenticates against the real target, not just that the hash comparison matched"],
    },
    nextStep: [
      "Try the recovered credential against every other discovered service (credential reuse is extremely common in CTFs).",
    ],
    troubleshooting: [
      {
        symptom: "John reports 'No password hashes loaded'.",
        likelyCause: "Wrong hash file format, or John didn't auto-detect the hash type correctly.",
        verify: "Open the hash file and confirm it matches the expected *2john output format exactly (no extra whitespace/encoding issues).",
        fix: "Specify the format explicitly: john --format=FORMAT_NAME hash.txt.",
        recovery: "Re-generate the hash file with the correct *2john script for the file type.",
        avoid: "Always inspect the hash file content before running John, rather than assuming conversion succeeded silently.",
      },
    ],
  },
];
