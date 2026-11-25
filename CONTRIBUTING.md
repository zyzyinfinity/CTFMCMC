# Contributing

## Add a technique
1. Open the matching file in `lib/content/b2r/` or `lib/content/dfir/`.
2. Append an object following `Technique` in `lib/content/types.ts`.
3. `slug` must be unique kebab-case within its category (it becomes the URL).
4. Run `npm run lint && npm run build`.

## Add a Command Mistake
Append a `MistakeEntry` (see `lib/content/types.ts`) to `lib/content/mistakes.ts`.

## Add a category
Add an entry to `b2rCategories` or `dfirCategories` in `lib/content/categories.ts`, create the matching file under `lib/content/<section>/`, and wire it into that folder's `index.ts`.

## Rules
- Commands must be verified and accurate. Don't invent flags or output; mark expected output as illustrative.
- Use placeholders (`TARGET_IP`, `ATTACKER_IP`). No real IPs, credentials, flags or live-platform (HTB/THM) writeups.
- Educational/authorized-testing content only.
- Keep changes focused; no new dependencies without discussion.
