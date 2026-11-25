# CTF Arsenal

Offline-first **Boot2Root (B2R) & DFIR CTF reference manual**. Searchable techniques with copy-ready commands, expected output, next steps and troubleshooting. No backend, no analytics, no external requests at runtime.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Fuse.js (local search)

> **Disclaimer:** For education, CTFs and authorized testing only. Do not use these techniques against systems you do not own or have explicit written permission to test.

## Contents

| Section | Categories |
|---|---|
| **B2R** | Enumeration · Web Exploitation · Initial Access · Linux PrivEsc · Windows PrivEsc · Credential Attacks · Other (FTP/SMB/DB, pivoting, Docker) |
| **DFIR** | File · Network · Malware · Memory · Disk · Email · Log forensics · Archive Forensics · Encoding · Windows Artifacts · Document Forensics · Git Forensics · Incident Response |
| **Mistakes** | Command Mistakes & Recovery notebook |

Each technique: Concept → When to use → Workflow → Commands (flags, example, output, what to look for) → Tools → Findings → Next step → Troubleshooting.

The source is plain TypeScript data in [`lib/content/`](lib/content), so notes are readable and editable directly on GitHub.

## Quick start

```bash
git clone https://github.com/zyzyinfinity/CTFMCMC.git
cd CTFMCMC
npm install
npm run dev      # http://localhost:4300
```

Production: `npm run build && npm run start`. Port 4300 is fixed in `package.json`.

## Offline CTF mode (Linux/Kali/macOS)

Static export served by `python3`. Node is needed only for the first build.

```bash
./scripts/start-ctf.sh            # builds out-build/ if missing; serves 127.0.0.1 on first free port 4300-4399
./scripts/start-ctf.sh --lan      # bind 0.0.0.0 for another machine
./scripts/start-ctf.sh --rebuild  # force rebuild
./scripts/stop-ctf.sh
```

- Re-running start prints the existing URL.
- `--lan` is unauthenticated: use only on a trusted/isolated network.
- Portable: copy `out-build/` anywhere and run `python3 -m http.server 4300 --bind 127.0.0.1 --directory out-build`.

## Project layout

```
app/                 Routes (b2r, dfir, mistakes, search)
components/          UI (Sidebar, SearchBar, TechniqueView, CopyButton, ...)
lib/content/         Knowledge base, data only
  types.ts             Technique / Command / Tool / Mistake types
  categories.ts        Category metadata
  b2r/*.ts, dfir/*.ts  One file per category
  mistakes.ts          Command Mistakes & Recovery
lib/search.ts        Fuse.js index over all content
scripts/             Offline start/stop helpers
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: add an object to a category file, `npm run lint && npm run build`, open a PR.

## License

[MIT](LICENSE)
