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
    category: "git-forensics",
    title: e.title,
    tags: ["git", ...e.tags],
    concept: e.task,
    whenToUse: [e.task],
    workflow: [{ label: "Work from a copy of the repo/dump, never the only copy, and re-check with `git fsck`/`git log --all` before assuming history is exhausted" }],
    commands: e.cmds.map((c) => ({
      ...c,
      whenToUse: e.task,
      nextStep: e.next,
    })),
    tools: [],
    findings: {
      interesting: e.cmds.map((c) => c.lookFor),
      howToValidate: ["Confirm the recovered content's commit hash/path actually matches what you expect before treating it as the answer."],
    },
    nextStep: [e.next],
    troubleshooting: [
      {
        symptom: `Gotcha: ${e.gotcha}`,
        likelyCause: e.gotcha,
        verify: "Re-check what the command actually covers before assuming the search was complete.",
        fix: e.gotchaFix,
        recovery: "Re-run against the original repo/dump, not a partially-processed copy.",
        avoid: e.gotchaFix,
      },
    ],
  };
}

export const gitForensicsTechniques: Technique[] = [
  entry({
    slug: "detect-exposed-git",
    title: "Detect an Exposed .git Directory",
    tags: ["exposed git", "web", "http_code", "head", "recon"],
    task: "Confirm a web target is serving its .git directory (a very common misconfiguration crossover with web recon).",
    cmds: [
      {
        syntax: "curl -s -o /dev/null -w '%{http_code}' TARGET_URL/.git/HEAD",
        example: "curl -s -o /dev/null -w '%{http_code}' http://target/.git/HEAD",
        description: "Requests the one file every Git repo always has at a fixed path. A 200 response confirms exposure even if directory listing/autoindex is disabled — HEAD doesn't need listing to be fetched directly.",
        lookFor: "200. Follow up with `curl TARGET_URL/.git/HEAD` to see the content — a line like 'ref: refs/heads/main' confirms it's a real Git HEAD file, not a coincidental 200 on an unrelated page.",
      },
    ],
    gotcha: "A 200 on /.git/HEAD with content that isn't 'ref: refs/...' (e.g. a custom 200 error page) is a false positive — some servers return 200 for everything.",
    gotchaFix: "Always read the actual body, not just the status code, before concluding .git is genuinely exposed.",
    next: "Move to dumping the exposed .git directory over HTTP.",
  }),
  entry({
    slug: "dump-exposed-git-http",
    title: "Dump an Exposed .git Over HTTP",
    tags: ["git-dumper", "gittools", "gitdumper", "wget", "directory listing"],
    task: "Recover an exposed .git directory's contents from a web server and rebuild a working tree from it.",
    cmds: [
      {
        syntax: "wget -r -np TARGET_URL/.git/",
        example: "wget -r -np http://target/.git/",
        description: "Recursive mirror — only works if the server has directory listing/autoindex enabled for .git/, which is the less common case.",
        lookFor: "A local .git/ folder tree matching what the listing showed.",
      },
      {
        syntax: "git-dumper TARGET_URL/.git/ OUT_DIR",
        example: "git-dumper http://target/.git/ ./dump",
        description: "The common case: no directory listing. git-dumper (pip install git-dumper) walks known Git internal paths (HEAD, refs, objects referenced from them, packed-refs, index) to reconstruct the repo without needing a listing at all.",
        lookFor: "A populated OUT_DIR/.git with HEAD, refs/, objects/ containing real object files.",
      },
      {
        syntax: "git clone GITTOOLS_URL && GitTools/Dumper/gitdumper.sh TARGET_URL/.git/ OUT_DIR",
        example: "git clone https://github.com/internetwache/GitTools.git\nGitTools/Dumper/gitdumper.sh http://target/.git/ ./dump",
        description: "Alternative dumper with the same no-listing-needed approach, bundled as a shell script rather than a pip package.",
        lookFor: "Same as above: a populated dump directory.",
      },
      {
        syntax: "cd OUT_DIR && git checkout .",
        example: "cd dump && git checkout .",
        description: "Once the raw .git is dumped, this materializes the actual working tree files from it. If the dump is partial/corrupted and checkout fails, use GitTools' extractor instead.",
        lookFor: "Working tree files appearing in OUT_DIR, matching what HEAD points to.",
      },
      {
        syntax: "GitTools/Extractor/extractor.sh OUT_DIR EXTRACTED_DIR",
        example: "../GitTools/Extractor/extractor.sh ./dump ./extracted",
        description: "Fallback when `git checkout .` fails on a partial dump — extracts whatever commits/trees/blobs it can still resolve from the raw objects present, even with some refs/objects missing.",
        lookFor: "One subfolder per recoverable commit under EXTRACTED_DIR, even if the latest/HEAD commit itself couldn't be fully checked out.",
      },
    ],
    gotcha: "Naive per-object dumpers only fetch loose objects they can enumerate from refs/logs — they miss objects bundled into pack files, so a dump that `git checkout .`/`git log` shows as suspiciously thin may just be missing packed history.",
    gotchaFix: "Explicitly also try fetching /.git/objects/pack/pack-*.idx and the matching .pack file (list likely names via /.git/objects/info/packs if exposed) and drop them into objects/pack/ before concluding the dump is complete.",
    next: "Once checked out (or extracted), browse full history for the flag — `git log --all` and friends.",
  }),
  entry({
    slug: "browse-full-git-history",
    title: "Browse Full History for the Flag",
    tags: ["git log", "all branches", "grep", "show", "history"],
    task: "Search every commit on every branch/tag — not just the currently checked-out branch — for the flag.",
    cmds: [
      {
        syntax: "git log --all --oneline",
        example: "git log --all --oneline",
        description: "--all matters: without it, `git log` only shows the current branch's ancestry. The flag commit may sit on a branch or tag that was never checked out by default.",
        lookFor: "Commits not reachable from the default branch's normal `git log` output — extra branches/tags worth inspecting individually.",
      },
      {
        syntax: "git log -p --all | grep -i FLAG_PATTERN",
        example: "git log -p --all | grep -i flag",
        description: "Searches every diff ever made, across every branch, for the pattern — catches content that only ever existed in an intermediate commit, even if later removed everywhere.",
        lookFor: "A matching line; scroll up in the same `git log -p` output (or re-run with surrounding commit info) to get the full context/commit hash.",
      },
      {
        syntax: "git show COMMIT:PATH",
        example: "git show a1b2c3d:config/secret.yml",
        description: "Reads one file's exact content as of a specific commit, without checking anything out — no working-tree changes, safe to run repeatedly while exploring.",
        lookFor: "The file's content exactly as it existed at that commit.",
      },
    ],
    gotcha: "Forgetting --all is the single most common miss here — a clean `git log`/`git log -p` with no matches just means nothing matches on the currently checked-out branch, not that nothing exists in the repo.",
    gotchaFix: "Make --all a reflex on every git log/grep pass over an unfamiliar repo, not just when a first pass comes up empty.",
    next: "If the flag commit was later deleted on all branches rather than just living on another branch, move to the deleted-file recovery technique.",
  }),
  entry({
    slug: "recover-deleted-file-from-history",
    title: "Recover a File Deleted in a Later Commit",
    tags: ["diff-filter", "deleted file", "checkout path", "recovery"],
    task: "Restore the exact content of a file that was removed by a later commit.",
    cmds: [
      {
        syntax: "git log --diff-filter=D --summary",
        example: "git log --diff-filter=D --summary",
        description: "Lists every commit that deleted at least one file, with the deleted path(s) shown under 'delete mode'.",
        lookFor: "A commit/path pair matching the file you suspect was removed.",
      },
      {
        syntax: "git show COMMIT_BEFORE_DELETE:PATH > recovered_file",
        example: "git show a1b2c3d~1:secret.txt > recovered_file",
        description: "Reads the file's content from the commit immediately before the one that deleted it (use the delete commit's hash with ~1, or the parent commit's own hash directly).",
        lookFor: "recovered_file containing the file's final content before deletion.",
      },
      {
        syntax: "git checkout COMMIT_BEFORE_DELETE -- PATH",
        example: "git checkout a1b2c3d~1 -- secret.txt",
        description: "Alternative that restores the file straight into the current working tree (and stages it) instead of redirecting to a new filename.",
        lookFor: "The file reappearing in the working directory, now tracked/staged at its pre-deletion content.",
      },
    ],
    gotcha: "`git log --diff-filter=D --summary` only shows the delete commit on the branch you're currently traversing — a file deleted on one branch but never on another (or never committed as deleted anywhere reachable) needs `--all` added too.",
    gotchaFix: "Add --all to the diff-filter search as well: `git log --all --diff-filter=D --summary`.",
    next: "If diff-filter=D shows nothing but you still suspect a removed file, the history itself may have been rewritten rather than committed as a normal delete — check for dangling commits instead.",
  }),
  entry({
    slug: "dangling-unreachable-objects",
    title: "Find Dangling (Unreachable) Commits/Blobs",
    tags: ["fsck", "dangling", "unreachable", "lost-found", "reset --hard", "rebase", "filter-branch"],
    task: "Recover commits/blobs that still physically exist in .git/objects even though history was rewritten (reset --hard, rebase, filter-branch) so no ref points to them anymore.",
    cmds: [
      {
        syntax: "git fsck --full --no-reflogs --unreachable --lost-found",
        example: "git fsck --full --no-reflogs --unreachable --lost-found",
        description: "The key technique when `git log`/`git log --all` looks empty or incomplete: lists every commit, tree, and blob object physically present in .git/objects that no current ref resolves to. --no-reflogs excludes objects only kept alive by the reflog, surfacing genuinely orphaned ones; --full also checks pack files, not just loose objects.",
        lookFor: "Any 'unreachable commit <hash>' / 'unreachable blob <hash>' / 'unreachable tree <hash>' line — each is worth inspecting individually.",
      },
      {
        syntax: "git show DANGLING_SHA",
        example: "git show 53d4545becdaa1a27c8ddd241e27073e9e4a4ad6",
        description: "Works directly on a dangling commit hash exactly like any normal commit — shows its message, diff, and parent.",
        lookFor: "Commit message/diff content, and its parent hash to walk further back through rewritten history if needed.",
      },
      {
        syntax: "git cat-file -p DANGLING_SHA",
        example: "git cat-file -p 758825df7b85215d4f931ff9e2d59fd7d91120cc",
        description: "Prints a Git object's raw content directly by hash — needed for a dangling blob (`git show` expects a commit-like object; a bare blob hash needs cat-file to read its content).",
        lookFor: "Raw file content for a blob, or a tree listing (mode/type/hash/name rows) for a dangling tree.",
      },
    ],
    gotcha: "If `git gc`/`git gc --prune=now` has already run since the history was rewritten, truly unreachable objects can be permanently deleted — fsck then finds nothing because the objects are actually gone, not just hard to find.",
    gotchaFix: "Run fsck as early as possible on any dumped/handed-over repo, before doing anything (including a routine `git gc`) that could prune unreachable objects.",
    next: "Walk each dangling commit's tree/parent pointers (via repeated cat-file -p) to pull in any other objects it references that weren't independently flagged as dangling.",
  }),
  entry({
    slug: "tags-and-stashes",
    title: "Annotated Tags and Stashes",
    tags: ["tag", "annotated tag", "stash", "orphaned stash"],
    task: "Check for a flag hidden in a tag's message or in a stashed-but-never-committed change.",
    cmds: [
      {
        syntax: "git tag -l",
        example: "git tag -l",
        description: "Lists every tag in the repo.",
        lookFor: "Any tag name, even an innocuous-looking one.",
      },
      {
        syntax: "git show TAG_NAME",
        example: "git show flagtag",
        description: "For an annotated tag, shows the tag's own message (separate from any commit message) plus the commit it points to.",
        lookFor: "Content in the tag message itself — annotated tags carry their own tagger/date/message independent of the commit they point at.",
      },
      {
        syntax: "git stash list   (and check: git fsck --unreachable if the stash ref was dropped)",
        example: "git stash list",
        description: "Lists any stashed changes still referenced by the repo's stash ref. If the stash itself was later dropped (`git stash drop`), its commits become unreachable — the same `git fsck --unreachable` pass used for dangling commits surfaces orphaned stash commits too (they show up as ordinary unreachable commits with a 'WIP on ...' message).",
        lookFor: "A 'stash@{N}' entry, or (if dropped) an unreachable commit from fsck whose message starts with 'WIP on' / 'index on'.",
      },
    ],
    gotcha: "A lightweight tag (created with `git tag NAME`, no -a) has no message of its own at all — only annotated tags (`git tag -a NAME -m '...'`) carry a separate message to check with `git show`.",
    gotchaFix: "If `git show TAG_NAME` shows only the pointed-at commit with no distinct tag message/tagger line, it's lightweight — there's nothing extra hidden in the tag object itself.",
    next: "Treat any recovered tag message or stash content as part of the same evidence set as regular commits — check its diff/content against the rest of the history.",
  }),
  entry({
    slug: "manual-object-retrieval",
    title: "Manual Object Retrieval From a Hash",
    tags: ["object path", "manual fetch", "partial dump", "cat-file", "pack files"],
    task: "Pull a single Git object directly when only its hash is known and an automated dumper missed it (common on a partial/broken dump).",
    cmds: [
      {
        syntax: "curl -o .git/objects/FIRST2/REST38 TARGET_URL/.git/objects/FIRST2/REST38",
        example: "curl -o .git/objects/ab/cdef1234567890abcdef1234567890abcdef12 http://target/.git/objects/ab/cdef1234567890abcdef1234567890abcdef12",
        description: "Every Git object (commit, tree, or blob) is stored as a single file at .git/objects/<first 2 hex chars of the SHA>/<remaining 38 hex chars>. If a hash is known from anywhere — a leaked log line, another object's parent pointer — it can be fetched directly at that path, even if the automated dumper never discovered it.",
        lookFor: "The object file landing at the correct path inside a local .git tree you're reconstructing.",
      },
      {
        syntax: "git cat-file -p HASH",
        example: "git cat-file -p abcdef1234567890abcdef1234567890abcdef12",
        description: "Reads the fetched object's content once it's in place in a local .git/objects directory — works for commits, trees, and blobs alike.",
        lookFor: "A commit (message/tree/parent), tree (file listing), or blob (raw content), depending on what the hash pointed to.",
      },
    ],
    gotcha: "Pack files (.git/objects/pack/*.pack) bundle many objects together under one name — none of their contents exist as individual loose-object files at the usual <2hex>/<38hex> path, so a naive per-object fetch loop (or a dumper that only tries loose-object paths) silently misses everything packed.",
    gotchaFix: "Explicitly check for and fetch /.git/objects/info/packs (lists pack filenames) plus the matching .pack and .idx files, and unpack them locally (`git index-pack` on the .pack, or `git unpack-objects < file.pack`) if a dump looks incomplete despite following every known ref/parent pointer.",
    next: "Once an object is readable, follow its tree/parent pointers (repeating this same fetch-and-cat-file step) to pull in whatever else the partial dump is still missing.",
  }),
];
