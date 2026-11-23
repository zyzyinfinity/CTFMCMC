# CTF Arsenal

Offline-first Boot2Root (B2R) & DFIR CTF reference manual. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. No backend, no external APIs, no analytics — all content and search run client/build-side.

## Run locally

```bash
npm install
npm run dev     # http://localhost:4300
```

Production build (fully static where possible):

```bash
npm run build
npm run start   # http://localhost:4300
```

Port 4300 is fixed in `package.json` to avoid colliding with other local projects (e.g. SecureScope on 3000).

No internet connection is required after `npm install` — all fonts, search (Fuse.js), and content are bundled locally.

## Folder structure

```
app/                        Routes (App Router)
  page.tsx                   Homepage
  b2r/page.tsx                Boot2Root section overview
  b2r/[category]/page.tsx     Category listing
  b2r/[category]/[slug]/page.tsx   Technique detail
  dfir/...                    Same structure for DFIR
  mistakes/page.tsx           Command Mistakes & Recovery index
  mistakes/[section]/[slug]/page.tsx  Mistake detail
  search/page.tsx             Full search results page
components/                 UI components (Sidebar, SearchBar, TechniqueView, CopyButton, ...)
lib/content/                All knowledge content — data only, no JSX
  types.ts                    Technique / Tool / Command / Mistake / Category types
  categories.ts                Category metadata per section
  b2r/*.ts                     B2R techniques, one file per category
  dfir/*.ts                    DFIR techniques, one file per category
  mistakes.ts                   Command Mistakes & Recovery entries
  index.ts                      Aggregation + lookup helpers
lib/search.ts                Fuse.js-based local search index over all content
```

## Adding a new technique

1. Open the matching category file under `lib/content/b2r/` or `lib/content/dfir/`.
2. Add a new object to the exported array, following the `Technique` type in `lib/content/types.ts` (Concept, When to Use, Workflow, Commands, Tools, Findings, Next Step, Troubleshooting).
3. Give it a unique `slug` (kebab-case) within its category — this becomes the URL.
4. Save. The sidebar, search index, and static pages pick it up automatically (restart `npm run dev` if already running, or just rebuild).

## Adding a new Command Mistake entry

Add an object to the array in `lib/content/mistakes.ts` following the `MistakeEntry` type. It appears automatically under `/mistakes/<section>` and in search.

## Adding a new category

Add an entry to `b2rCategories` or `dfirCategories` in `lib/content/categories.ts`, then create a matching file under `lib/content/b2r/` or `lib/content/dfir/` and wire it into that section's `index.ts`.

## Content coverage (current)

This is a living knowledge base. Phase 1–3 scaffolding (search, navigation, template, mistakes notebook, flowcharts) is complete and populated with real, non-placeholder techniques across every required category — not yet to full exhaustive depth on every sub-bullet from the original spec. Extend using the pattern above; nothing else needs to change.

## Verified

- `npm run build` — passes (TypeScript strict, ESLint clean).
- `npm run start` — homepage, a B2R technique, a DFIR technique, a mistake entry, and an unknown route (404) all verified responding correctly.
- All content pages are statically prerendered (`generateStaticParams`) for offline reliability.

## Offline CTF mode (static, Kali/Linux)

Requires `python3` (runtime) and `node`/`npm` only for the first build. The deployed site/config is unchanged (static export is enabled only via `STATIC_EXPORT=1`).

```bash
./start-ctf.sh            # builds out-build/ if missing; serves 127.0.0.1 on first free port 4300-4399
./start-ctf.sh --lan      # bind 0.0.0.0 for access from another machine
./start-ctf.sh --rebuild  # force rebuild
./stop-ctf.sh
```

- Re-running start prints the existing URL (no duplicate instance).
- LAN: run with `--lan`, find IP via `ip a`, open `http://<LAN-IP>:<port>/` from the other machine. Same network and firewall must allow the port. Unauthenticated; use only on a trusted/isolated CTF network, never forward the port.
- Portable: after one build, copy `out-build/` anywhere and run `python3 -m http.server 4300 --bind 127.0.0.1 --directory out-build` (no Node needed).
- Fonts are self-hosted at build time; no runtime external requests.
