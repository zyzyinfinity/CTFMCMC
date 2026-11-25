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

// Compact builder: maps task / command / look-for / gotcha onto the Technique schema.
function entry(e: Entry): Technique {
  return {
    slug: e.slug,
    section: "dfir",
    category: "encoding",
    title: e.title,
    tags: ["encoding", "decode", ...e.tags],
    concept: e.task,
    whenToUse: [e.task],
    workflow: [{ label: "Run the command, then check the output's magic bytes with file / xxd | head" }],
    commands: e.cmds.map((c) => ({
      ...c,
      whenToUse: e.task,
      nextStep: e.next,
    })),
    tools: [],
    findings: {
      interesting: e.cmds.map((c) => c.lookFor),
      howToValidate: ["Run `file` on the output; readable text or a known magic number means the decode worked."],
    },
    nextStep: [e.next],
    troubleshooting: [
      {
        symptom: `Gotcha: ${e.gotcha}`,
        likelyCause: e.gotcha,
        verify: "Re-check the input against the expected alphabet/format.",
        fix: e.gotchaFix,
        recovery: "Re-run on the original input, not on partially decoded output.",
        avoid: e.gotchaFix,
      },
    ],
  };
}

const PY_STDOUT = "sys.stdout.buffer.write";

export const encodingTechniques: Technique[] = [
  entry({
    slug: "identify-unknown-encoding",
    title: "Identify Unknown Encoding",
    tags: ["identify", "base64", "base32", "base58", "base85", "ascii85", "alphabet"],
    task: "Identify what encoding an unknown blob uses.",
    cmds: [
      {
        syntax: "file FILE_PATH; head -c 200 FILE_PATH",
        example: "file blob.txt; head -c 200 blob.txt",
        description: "Shows what `file` thinks it is, then the first bytes so you can eyeball the character set.",
        lookFor:
          "Base64: A-Za-z0-9+/= (URL-safe: -_). Base32: A-Z2-7=. Base58: alphanumerics with no 0 O I l. Base85/ASCII85: wide punctuation, often wrapped in <~ ~>. Hex: 0-9a-f only. Common Base64 prefixes: iVBORw0KGgo = PNG, H4sI = gzip, UEsD = ZIP, JVBERi = PDF, TVqQ = Windows EXE, /9j/ = JPEG.",
      },
    ],
    gotcha: "`file` just reports \"ASCII text\" for any text-based encoding; it does not name the encoding.",
    gotchaFix: "Identify by character set and padding (Base64/32 end in =), or run CyberChef's Magic operation.",
    next: "Decode with the matching page: Base64, Base32, Base58, Base85 or Hex/Binary/Octal.",
  }),
  entry({
    slug: "base64-decode-encode",
    title: "Base64 Decode / Encode",
    tags: ["base64", "url-safe", "b64"],
    task: "Decode or encode Base64.",
    cmds: [
      {
        syntax: "base64 -d FILE_PATH > OUT_FILE",
        example: "base64 -d file.b64 > out",
        description: "Decodes a Base64 file to raw bytes.",
        lookFor: "`file out` reports a real type (PNG, gzip, ZIP, text) instead of `data`.",
      },
      {
        syntax: "echo -n 'STRING' | base64 -d",
        example: "echo -n 'ZmxhZ3t0ZXN0fQ==' | base64 -d",
        description: "Decodes an inline string. Use `echo -n` so no newline is added; use `| base64` (no -d) to encode.",
        lookFor: "Readable text such as flag{test}.",
      },
      {
        syntax: "tr '_-' '/+' < FILE_PATH | base64 -d > OUT_FILE",
        example: "tr '_-' '/+' < urlsafe.b64 | base64 -d > out",
        description: "Converts the URL-safe alphabet (-_) back to standard (+/) before decoding.",
        lookFor: "Clean decode with no \"invalid input\" error.",
      },
    ],
    gotcha: "Web tools and JWTs use the URL-safe alphabet (- and _ instead of + and /) and often drop the = padding.",
    gotchaFix: "Swap with tr '_-' '/+' first; if still \"invalid input\", append = until the length is a multiple of 4. On macOS, decode is `base64 -D`.",
    next: "Run `file out`; if it is another encoding or an archive, decode again (see Multi-Layer Encoding).",
  }),
  entry({
    slug: "base32-decode",
    title: "Base32 Decode",
    tags: ["base32", "b32"],
    task: "Decode Base32.",
    cmds: [
      {
        syntax: "base32 -d FILE_PATH > OUT_FILE",
        example: "base32 -d file.b32 > out",
        description: "Decodes Base32 to raw bytes.",
        lookFor: "Input made only of A-Z, 2-7 and = padding; output is readable or has a magic number.",
      },
    ],
    gotcha: "Base32 is case-sensitive and uppercase only; lowercase input fails.",
    gotchaFix: "Uppercase first: tr a-z A-Z < file.b32 | base32 -d > out",
    next: "Run `file out` and continue decoding if needed.",
  }),
  entry({
    slug: "base58-decode",
    title: "Base58 Decode",
    tags: ["base58", "bitcoin", "b58"],
    task: "Decode Base58 (no coreutils tool exists).",
    cmds: [
      {
        syntax: "python3 -c \"import base58,sys;sys.stdout.buffer.write(base58.b58decode(open('FILE_PATH').read().strip()))\"",
        example: "python3 -c \"import base58,sys;sys.stdout.buffer.write(base58.b58decode(open('f').read().strip()))\"",
        description: "Decodes Base58 using the `base58` pip package (pip install base58; not in the stdlib).",
        lookFor: "Readable text or a magic number in the output.",
      },
      {
        syntax: "python3 -c \"stdlib-only Base58 decode\"",
        example:
          "python3 -c \"A='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';s=open('f').read().strip();n=0\nfor c in s:n=n*58+A.index(c)\nimport sys;sys.stdout.buffer.write(b'\\0'*(len(s)-len(s.lstrip('1')))+n.to_bytes((n.bit_length()+7)//8,'big'))\"",
        description: "No-dependency fallback using the Bitcoin alphabet; works offline. Leading 1s become zero bytes.",
        lookFor: "Same as above; a ValueError means a character outside the alphabet (0, O, I or l).",
      },
    ],
    gotcha: "The Bitcoin alphabet has no 0, O, I or l; a character from that set means it is not Bitcoin-style Base58 (Flickr/Ripple alphabets differ).",
    gotchaFix: "Strip trailing newlines and whitespace, or try CyberChef's \"From Base58\" with another alphabet.",
    next: "Run `file` on the output and continue decoding if needed.",
  }),
  entry({
    slug: "base85-decode",
    title: "Base85 / ASCII85 Decode",
    tags: ["base85", "ascii85", "a85", "z85"],
    task: "Decode Base85 / ASCII85 (no standard CLI tool; use Python stdlib).",
    cmds: [
      {
        syntax: "python3 -c \"import base64,sys;sys.stdout.buffer.write(base64.a85decode(open('FILE_PATH','rb').read(),adobe=True))\"",
        example: `python3 -c "import base64,sys;${PY_STDOUT}(base64.a85decode(open('file.a85','rb').read(),adobe=True))" > out`,
        description: "Decodes ASCII85 that has the <~ ~> Adobe delimiters.",
        lookFor: "Input starting with <~ and ending with ~>; output is readable or a known file type.",
      },
      {
        syntax: "python3 -c \"import base64,sys;sys.stdout.buffer.write(base64.b85decode(open('FILE_PATH','rb').read().strip()))\"",
        example: `python3 -c "import base64,sys;${PY_STDOUT}(base64.b85decode(open('file.b85','rb').read().strip()))" > out`,
        description: "Decodes the Git/RFC1924 Base85 variant (no <~ ~> delimiters).",
        lookFor: "A clean decode; ValueError means the wrong variant.",
      },
    ],
    gotcha: "Two incompatible variants exist: ASCII85 (a85decode, with or without <~ ~>) and RFC1924/Git (b85decode). The wrong one errors or gives garbage.",
    gotchaFix: "Delimiters <~ ~> mean a85decode with adobe=True; without them, try a85decode (no adobe), then b85decode. Or use CyberChef \"From Base85\".",
    next: "Run `file out` and continue decoding if needed.",
  }),
  entry({
    slug: "hex-binary-octal",
    title: "Hex / Binary / Octal Decode",
    tags: ["hex", "binary", "octal", "xxd"],
    task: "Convert between hex, binary-string and octal text and raw bytes.",
    cmds: [
      {
        syntax: "xxd -r -p HEX_FILE > OUT_FILE",
        example: "xxd -r -p hex.txt > out",
        description: "Hex text to raw bytes (-p = plain hex with no offsets). Reverse: `xxd -p FILE_PATH` (add `xxd FILE_PATH > hex.txt` for an offset dump).",
        lookFor: "`file out` shows a real type.",
      },
      {
        syntax: "python3 -c \"s='BITSTRING';print(bytes(int(s[i:i+8],2) for i in range(0,len(s),8)))\"",
        example: "python3 -c \"s='0100100001101001';print(bytes(int(s[i:i+8],2) for i in range(0,len(s),8)))\"",
        description: "Binary string (no spaces) to bytes, 8 bits at a time. Output: b'Hi'.",
        lookFor: "Printable ASCII. Gibberish means wrong bit grouping or bit order.",
      },
      {
        syntax: "python3 -c \"print(bytes(int(x,8) for x in 'OCTAL_VALUES'.split()))\"",
        example: "python3 -c \"print(bytes(int(x,8) for x in '110 151'.split()))\"",
        description: "Space-separated octal values to bytes. Output: b'Hi'.",
        lookFor: "Printable ASCII.",
      },
    ],
    gotcha: "For `int(x, 2)` the base is an int, not a string: int('01001000','2') raises TypeError. Hex input with 0x prefixes, spaces or an odd digit count breaks `xxd -r -p`.",
    gotchaFix: "Pass the base as an int; strip 0x, spaces and newlines first (tr -d ' \\n'). CyberChef \"From Binary\" / \"From Octal\" handles delimiters.",
    next: "Run `file` on the output and continue decoding if needed.",
  }),
  entry({
    slug: "xor-decode",
    title: "XOR Decode (Single / Multi-Byte Key)",
    tags: ["xor", "brute force", "crib", "known plaintext", "key"],
    task: "Recover XOR-encoded data: brute-force a single-byte key, or use a crib for longer keys.",
    cmds: [
      {
        syntax: "python3 xor-brute (single byte, search for 'flag')",
        example:
          "python3 -c \"\ndata=open('f','rb').read()\nfor k in range(256):\n    out=bytes(b^k for b in data)\n    if b'flag' in out.lower(): print(k,out)\"",
        description: "Tries all 256 single-byte keys and prints hits containing 'flag'. Change the search string to match the CTF's flag format. CyberChef: \"XOR Brute Force\".",
        lookFor: "A key number with readable plaintext. Case-insensitive matching can give extra false hits; judge by readability.",
      },
      {
        syntax: "python3 crib: key = ciphertext[offset:] XOR known_plaintext",
        example:
          "python3 -c \"\nd=open('f','rb').read();p=b'flag{';o=0\nprint(bytes(d[o+i]^p[i] for i in range(len(p))))\"",
        description: "XORs a known plaintext against the ciphertext at the same offset; the result is the key bytes at that position.",
        lookFor: "A short repeating pattern, which is the key (e.g. b'abcab'). Then decrypt: bytes(b^key[i%len(key)] for i,b in enumerate(d)).",
      },
    ],
    gotcha: "A multi-byte key cannot be brute-forced with the single-byte loop; you need a crib (known plaintext) such as a file header or flag{ at a known offset.",
    gotchaFix: "XOR a known substring against the ciphertext at the same offset to recover the key bytes (file magic numbers make good cribs).",
    next: "Decrypt the whole file with the recovered key, then run `file` on the result.",
  }),
  entry({
    slug: "zero-width-unicode-stego",
    title: "Unicode / Zero-Width Character Steganography",
    tags: ["zero-width", "unicode", "u+200b", "stego", "invisible", "text"],
    task: "Detect and decode data hidden in zero-width characters (U+200B, U+200C, U+200D, U+FEFF).",
    cmds: [
      {
        syntax: "LC_ALL=C grep -nP '\\xE2\\x80[\\x8B-\\x8D]|\\xEF\\xBB\\xBF' FILE_PATH",
        example: "LC_ALL=C grep -nP '\\xE2\\x80[\\x8B-\\x8D]|\\xEF\\xBB\\xBF' file.txt",
        description: "Matches the UTF-8 bytes of U+200B/200C/200D (E2 80 8B-8D) and U+FEFF (EF BB BF), and prints the lines containing them.",
        lookFor: "Any hit on a line that looks normal. View with `cat -A`: they appear as M-bM-^@M-^K etc.",
      },
      {
        syntax: "python3 zero-width to bits",
        example:
          "python3 -c \"\ns=open('file.txt',encoding='utf8').read()\nz=[c for c in s if c in '\\u200b\\u200c\\u200d\\ufeff']\nprint(len(z),[hex(ord(c)) for c in z[:16]])\nb=''.join('0' if c=='\\u200b' else '1' for c in z if c in '\\u200b\\u200c')\nprint(bytes(int(b[i:i+8],2) for i in range(0,len(b)-7,8)))\"",
        description: "Counts the hidden characters, shows the first few, and decodes the common scheme U+200B = 0, U+200C = 1 into bytes. CyberChef: \"Remove/Extract Zero-Width Characters\" (or a dedicated zero-width stego decoder).",
        lookFor: "Readable text. If it is gibberish, the mapping differs (3-symbol or 4-symbol encodings using U+200D/U+FEFF); change the mapping.",
      },
    ],
    gotcha: "These characters are invisible in normal editors and terminals; the text looks fine.",
    gotchaFix: "Always check suspiciously short/long text with xxd or cat -A, or paste it into CyberChef. `grep -P '\\x{200b}'` needs a UTF-8 locale; the byte-pattern version above works under LC_ALL=C.",
    next: "Decode the bit/char sequence, then run `file` on the result.",
  }),
  entry({
    slug: "endianness-byte-order",
    title: "Byte Order / Endianness",
    tags: ["endianness", "little endian", "big endian", "xxd", "swap"],
    task: "Read multi-byte values and magic numbers in the correct byte order.",
    cmds: [
      {
        syntax: "xxd -e -g4 FILE_PATH",
        example: "xxd -e -g4 file.bin",
        description: "Dumps 4-byte groups as little-endian words (-e), so a stored `ef be ad de` prints as deadbeef. Plain `xxd -g4` shows the bytes in file order.",
        lookFor: "Compare both dumps against the expected magic number or integer; whichever matches gives the byte order.",
      },
      {
        syntax: "python3 -c \"import struct;print(hex(struct.unpack('<I',bytes.fromhex('HEX'))[0]))\"",
        example: "python3 -c \"import struct;print(hex(struct.unpack('<I',bytes.fromhex('efbeadde'))[0]))\"",
        description: "Reads 4 bytes as a little-endian unsigned int (use '>I' for big-endian). Output: 0xdeadbeef.",
        lookFor: "The value that looks right (a plausible length, offset or timestamp).",
      },
    ],
    gotcha: "Reading little-endian bytes as big-endian gives wrong integers and missed magic-number matches. Reversing a whole hex blob is not the same as swapping per 2/4/8-byte word.",
    gotchaFix: "Decide the word size first (2, 4 or 8 bytes), then swap per word. CyberChef \"Swap endianness\" lets you set the word length.",
    next: "Re-read the field with the correct byte order and continue the analysis.",
  }),
  entry({
    slug: "gzip-zlib-decompress",
    title: "Gzip / Zlib / Raw Deflate Decompress",
    tags: ["gzip", "zlib", "deflate", "gunzip", "compression", "zlib-flate"],
    task: "Decompress gzip, zlib or raw deflate data.",
    cmds: [
      {
        syntax: "gunzip -c FILE.gz > OUT_FILE",
        example: "gunzip -c file.gz > out",
        description: "Decompresses gzip (magic 1f 8b) to stdout and keeps the original file (plain `gunzip` deletes the .gz).",
        lookFor: "Readable output or a known file type.",
      },
      {
        syntax: "zlib-flate -uncompress < FILE_PATH > OUT_FILE",
        example: "zlib-flate -uncompress < file > out",
        description: "Decompresses a zlib stream (starts 78 01 / 78 9c / 78 da). Needs qpdf (`apt install qpdf`).",
        lookFor: "Readable output or a known file type.",
      },
      {
        syntax: "python3 -c \"import zlib;print(zlib.decompress(open('FILE_PATH','rb').read(), WBITS))\"",
        example: "python3 -c \"import zlib;print(zlib.decompress(open('f','rb').read(), 47))\"",
        description: "WBITS 47 auto-detects gzip or zlib headers; use -15 for raw deflate with no header at all (also: zlib.decompressobj(-15).decompress(data)).",
        lookFor: "Decompressed bytes; zlib.error means the wrong WBITS value.",
      },
    ],
    gotcha: "gunzip only accepts gzip. A zlib stream or raw deflate fails with \"not in gzip format\".",
    gotchaFix: "Check the first bytes with xxd: 1f8b = gzip, 78xx = zlib, no header = raw deflate. Use zlib.decompress(data, 47) to auto-detect, or -15 for raw deflate.",
    next: "Run `file` on the output and continue decoding if needed.",
  }),
  entry({
    slug: "whitespace-stego",
    title: "Whitespace Steganography (snow)",
    tags: ["whitespace", "snow", "stegsnow", "trailing spaces", "tabs", "stego"],
    task: "Detect and decode data hidden in trailing spaces and tabs.",
    cmds: [
      {
        syntax: "grep -nP '[ \\t]+$' FILE_PATH | cat -A",
        example: "grep -nP '[ \\t]+$' file.txt | cat -A",
        description: "Lists lines that end in spaces or tabs. In `cat -A` output tabs show as ^I and the line end as $.",
        lookFor: "Many lines with trailing whitespace on text that has no reason to have it.",
      },
      {
        syntax: "stegsnow -C FILE_PATH",
        example: "stegsnow -C file.txt",
        description: "Extracts the hidden message (-C = it was compressed, snow's default). Install: `apt install stegsnow`; the binary is `snow` when built from source. Add -p PASSWORD if it was encrypted.",
        lookFor: "Readable text. Garbage or empty output means a password, no -C, or no snow data.",
      },
    ],
    gotcha: "Some tools hide data with a manual mapping (space = 0, tab = 1 per line) rather than snow, so `stegsnow` returns nothing.",
    gotchaFix: "Map the trailing characters per line yourself (space=0, tab=1, 8 bits per byte), or try stegsnow with and without -C.",
    next: "If the output is readable, you are done; otherwise try the manual space/tab mapping, then check it is not just whitespace noise.",
  }),
  entry({
    slug: "multi-layer-encoding",
    title: "Multi-Layer Encoding",
    tags: ["layers", "chain", "recipe", "magic bytes", "cyberchef"],
    task: "Peel several encoding layers one at a time, using each output's magic bytes to pick the next step.",
    cmds: [
      {
        syntax: "xxd OUT_FILE | head -2; file OUT_FILE",
        example: "xxd out | head -2; file out",
        description: "After each decode, check the first bytes. 1f8b = gzip, 78 9c = zlib, 504b0304 = ZIP, 89504e47 = PNG, 7f454c46 = ELF, 4d5a = Windows EXE. Printable text = probably another text encoding.",
        lookFor: "A recognised magic number. 89504E47 (PNG) means stop decoding: you now have a file to open.",
      },
    ],
    gotcha: "Decoding blindly in the wrong order (e.g. Base64 on already-decoded bytes) produces garbage and hides the right path.",
    gotchaFix: "Decode one layer at a time and inspect each output. In CyberChef chain the recipe, e.g. From Base64 → From Hex → XOR → Gunzip, and read the Output after each step.",
    next: "Stop at a file magic number and switch to the file-forensics pages.",
  }),
  {
    slug: "cyberchef-walkthrough",
    section: "dfir",
    category: "encoding",
    title: "CyberChef Walkthrough (Offline)",
    tags: ["encoding", "cyberchef", "magic", "recipe", "offline", "gchq"],
    concept: "CyberChef is a browser tool that chains encode/decode operations in a recipe and runs fully offline from a single HTML file.",
    whenToUse: ["Chaining several decodes, or quick brute force/detection with Magic.", "A local copy is needed because the pwnbox may have no internet."],
    workflow: [
      { label: "Open the local CyberChef HTML file in a browser", detail: "No server or internet needed. If you have no copy, get the release zip from github.com/gchq/CyberChef/releases and unzip it." },
      { label: "Paste the data into the Input pane (top right)" },
      { label: "Search the operation list (left) and drag or double-click operations into the Recipe pane (centre) in order", detail: "Output (bottom right) updates live as you add or reorder them." },
      { label: "Unknown blob? Add Magic first", detail: "It tests common decodings and suggests recipes; click a suggestion to load it." },
      { label: "Use the disable and breakpoint toggles on an operation to inspect each layer's output", detail: "Save the recipe via the Save icon to reuse it." },
    ],
    commands: [
      {
        syntax: "xdg-open CYBERCHEF_HTML (Linux) / open CYBERCHEF_HTML (macOS)",
        example: "xdg-open CyberChef.html",
        description: "Opens the local CyberChef file in the default browser. Use whatever the release file is actually called (it includes the version number).",
        lookFor: "The CyberChef UI loads with no network access.",
        whenToUse: "Start of any encoding challenge.",
        nextStep: "Paste input and build a recipe.",
      },
    ],
    tools: [],
    findings: {
      interesting: ["Magic highlights likely encodings with a confidence-ranked list of recipes."],
      suspicious: ["Output that stays binary after Magic suggests encryption or compression; try Gunzip / XOR Brute Force / Detect File Type."],
      howToValidate: ["Run Detect File Type on the output, or check the first bytes against known magic numbers."],
    },
    nextStep: ["Download the output and continue on the file-forensics pages once a file magic number appears."],
    troubleshooting: [
      {
        symptom: "Gotcha: the pwnbox has no internet and no local CyberChef copy",
        likelyCause: "CyberChef is not installed by default and the online version cannot be reached.",
        verify: "Check whether CyberChef.html (or the versioned filename) exists locally.",
        fix: "Before the event, download the release zip from github.com/gchq/CyberChef/releases and store the unzipped HTML on the pwnbox or in your CTF bundle.",
        recovery: "Fall back to the Python/CLI commands on the other encoding pages.",
        avoid: "Keep a local copy next to the other offline tools before the competition starts.",
      },
    ],
  },
];
