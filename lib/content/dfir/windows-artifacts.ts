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
    category: "windows-artifacts",
    title: e.title,
    tags: ["windows", "artifact", ...e.tags],
    concept: e.task,
    whenToUse: [e.task],
    workflow: [{ label: "Parse the artifact offline with the matching tool, then correlate its timestamps against other evidence before trusting them alone" }],
    commands: e.cmds.map((c) => ({
      ...c,
      whenToUse: e.task,
      nextStep: e.next,
    })),
    tools: [],
    findings: {
      interesting: e.cmds.map((c) => c.lookFor),
      howToValidate: ["Cross-check the parsed CSV/output against a second artifact (e.g. Prefetch vs Amcache vs Shimcache) before treating a single source as proof."],
    },
    nextStep: [e.next],
    troubleshooting: [
      {
        symptom: `Gotcha: ${e.gotcha}`,
        likelyCause: e.gotcha,
        verify: "Confirm the artifact's actual behaviour/limits before relying on it as sole evidence.",
        fix: e.gotchaFix,
        recovery: "Fall back to a corroborating artifact from this page.",
        avoid: e.gotchaFix,
      },
    ],
  };
}

export const windowsArtifactsTechniques: Technique[] = [
  {
    slug: "ez-tools-offline-setup",
    section: "dfir",
    category: "windows-artifacts",
    title: "Eric Zimmerman's Tools (EZ Tools) & Offline Setup",
    tags: ["windows", "artifact", "ez tools", "zimmerman", "regripper", "offline", "pecmd", "amcacheparser", "appcompatcacheparser", "jlecmd", "lecmd", "rbcmd", "sbecmd"],
    concept:
      "Most of the parsers on this page are Eric Zimmerman's EZ Tools (PECmd, AmcacheParser, AppCompatCacheParser, JLECmd, LECmd, RBCmd, SBECmd, SrumECmd, Registry Explorer) — a .NET tool suite, not something `apt`/`pip` can install. RegRipper is the CLI fallback for registry hives when EZ Tools aren't available.",
    whenToUse: ["Before relying on any entry below that names an EZ Tools CLI.", "When the pwnbox has no internet and these aren't already installed."],
    workflow: [
      { label: "Check whether the EZ Tools suite is already on the pwnbox", detail: "`Get-ChildItem` the usual install path, or just try running PECmd.exe." },
      { label: "If missing and offline, use the local bundled copy", detail: "Keep a copy with the CTF kit — EZ Tools ship as a .NET zip (via Kroll Artifact Parser (KAPE) 'Get-ZimmermanTools.ps1') and can't be fetched on the fly without internet." },
      { label: "Fall back to RegRipper for registry hives if EZ Tools aren't available at all", detail: "RegRipper is Perl-based and more likely to already be present on a forensics pwnbox/Kali." },
    ],
    commands: [
      {
        syntax: "rip.pl -r HIVE_PATH -f PROFILE_NAME",
        example: "rip.pl -r SYSTEM -f system",
        description: "RegRipper's actual CLI binary is `rip.pl` (Linux/Perl) or `rip.exe` (Windows) — \"regripper\" is the suite's name, not the command. -r points at the hive file, -f picks the matching plugin profile (system, software, sam, ntuser, usrclass...).",
        whenToUse: "Registry hive needs parsing and EZ Tools' Registry Explorer isn't available/preferred.",
        lookFor: "A block of plugin output per registry key category (run keys, USB history, network list, last logon) printed to stdout.",
        nextStep: "Move to the per-artifact entries below for Prefetch/Amcache/Shimcache/etc.",
      },
    ],
    tools: [],
    findings: {
      interesting: ["EZ Tools present and runnable — proceed with the per-artifact parsers below."],
      suspicious: ["No internet and no local EZ Tools copy — every entry below that names an EZ Tools CLI is blocked until one is bundled."],
      howToValidate: ["Run the tool with no args / `-h` to confirm it launches before pointing it at evidence."],
    },
    nextStep: ["Bundle Get-ZimmermanTools.ps1's output (or the KAPE distribution, which includes EZ Tools) with the CTF kit ahead of time."],
    troubleshooting: [
      {
        symptom: "Gotcha: EZ Tools can't be pip/apt installed on the fly if the pwnbox has no internet.",
        likelyCause: "They're a closed-source .NET tool suite distributed only via Eric Zimmerman's own download page/PowerShell installer.",
        verify: "Try running any EZ Tools binary; if it's not found and there's no internet, you're blocked.",
        fix: "Pre-stage a local copy (zip) with the CTF bundle/site before the event — don't assume the pwnbox already has them.",
        recovery: "RegRipper (Perl, CLI: rip.pl/rip.exe) is a reasonable fallback for registry hives specifically, but has no equivalent for Prefetch/Amcache/Shimcache/Jump Lists/LNK/Recycle Bin/SRUM/ShellBags.",
        avoid: "Keep the EZ Tools zip bundled offline alongside this site.",
      },
    ],
  },
  entry({
    slug: "registry-hive-analysis",
    title: "Registry Hive Analysis",
    tags: ["registry", "hive", "regripper", "registry explorer", "run keys", "usbstor", "persistence"],
    task: "Parse Windows registry hives offline for persistence, USB history, network history, and logon data.",
    cmds: [
      {
        syntax: "rip.pl -r HIVE_PATH -f PROFILE_NAME",
        example: "rip.pl -r SYSTEM -f system",
        description:
          "Hives live at C:\\Windows\\System32\\config\\{SAM,SYSTEM,SOFTWARE,SECURITY} (machine-wide) and per-user at NTUSER.DAT / UsrClass.dat. RegRipper's rip.pl/rip.exe runs a plugin set matched to -f against the hive. Registry Explorer (GUI, EZ Tools) is the alternative for interactive browsing.",
        lookFor:
          "Run/RunOnce keys (Software\\Microsoft\\Windows\\CurrentVersion\\Run*) for persistence; SYSTEM\\CurrentControlSet\\Enum\\USBSTOR for USB device history; network profile history; last-logon timestamps in SAM.",
      },
    ],
    gotcha: "Live-system hives are locked by the OS and can't be copied/parsed directly while Windows is running.",
    gotchaFix: "Work from an offline disk image (mount it) or a volume shadow copy; on a running box use a tool that reads the registry API instead of the raw file, or export with `reg save`.",
    next: "Cross-reference run-key/USBSTOR findings against Prefetch, Amcache and Shimcache for execution proof.",
  }),
  entry({
    slug: "prefetch-analysis",
    title: "Prefetch Analysis",
    tags: ["prefetch", "pecmd", "execution", "run count"],
    task: "Prove a program executed, with run count and last-run timestamps.",
    cmds: [
      {
        syntax: "PECmd.exe -d PREFETCH_DIR --csv OUT_DIR",
        example: "PECmd.exe -d C:\\Windows\\Prefetch --csv out.csv",
        description: "Parses every .pf file under C:\\Windows\\Prefetch into CSV: executable name, run count, last (and up to 8 prior) run timestamps, and files/volumes referenced during that run.",
        lookFor: "A matching .pf for the executable in question; run count and last-run time corroborating the suspected execution window.",
      },
    ],
    gotcha: "Prefetch is disabled or severely limited by default on server SKUs (Windows Server), so it may be empty even on a compromised host.",
    gotchaFix: "Confirm C:\\Windows\\Prefetch actually contains .pf files before relying on this artifact; if empty/sparse, lean on Amcache/Shimcache instead.",
    next: "Corroborate with Amcache (first-run + hash) and Shimcache (existence) for the same binary.",
  }),
  entry({
    slug: "amcache-analysis",
    title: "Amcache Analysis",
    tags: ["amcache", "amcacheparser", "sha1", "deleted files"],
    task: "Recover executed-binary SHA1, path and first-run time — even for binaries since deleted.",
    cmds: [
      {
        syntax: "AmcacheParser.exe -f AMCACHE_HVE_PATH --csv OUT_DIR",
        example: "AmcacheParser.exe -f Amcache.hve --csv out",
        description: "Parses C:\\Windows\\AppCompat\\Programs\\Amcache.hve into CSV covering executed/installed binaries, their SHA1 hash, full path, and first-run timestamp.",
        lookFor: "A SHA1 hash you can pivot on (VirusTotal/known-malware lists) and a first-run time, present even if the binary file itself was later deleted.",
      },
    ],
    gotcha: "Amcache's \"first run\" timestamp records first execution since the entry was created, not necessarily the very first time ever — entries can also persist from before a reimage in some cases.",
    gotchaFix: "Treat the timestamp as a lower bound and corroborate with Prefetch/Shimcache/event logs rather than trusting it in isolation.",
    next: "Pivot the SHA1 against known-malware/IOC lists, then confirm execution timing against Prefetch.",
  }),
  entry({
    slug: "shimcache-appcompatcache",
    title: "Shimcache (AppCompatCache) Analysis",
    tags: ["shimcache", "appcompatcache", "appcompatcacheparser", "lru"],
    task: "Show evidence a program existed/ran, without reliable timestamps.",
    cmds: [
      {
        syntax: "AppCompatCacheParser.exe -f SYSTEM_HIVE_PATH --csv OUT_DIR",
        example: "AppCompatCacheParser.exe -f SYSTEM --csv out",
        description: "Shimcache data lives inside the SYSTEM hive (SYSTEM\\CurrentControlSet\\Control\\Session Manager\\AppCompatCache); this parses it into CSV of cached executable paths and (where present) a last-modified timestamp.",
        lookFor: "A path for the binary in question — proves the file existed and the shim engine evaluated it, which usually means it ran.",
      },
    ],
    gotcha: "Shimcache entry order reflects LRU (least-recently-used) cache eviction, not chronological execution order — don't treat row order in the CSV as a timeline.",
    gotchaFix: "Use the (often absent/unreliable) last-modified field only as corroboration, and build the real timeline from Prefetch/Amcache/event logs instead.",
    next: "Treat Shimcache as existence evidence only; get timing from Prefetch or Amcache.",
  }),
  entry({
    slug: "jump-lists",
    title: "Jump Lists",
    tags: ["jump lists", "jlecmd", "automaticdestinations", "customdestinations", "recent files"],
    task: "Recover recently opened files per application from taskbar/Start Jump Lists.",
    cmds: [
      {
        syntax: "JLECmd.exe -d JUMPLIST_DIR --csv OUT_DIR",
        example: "JLECmd.exe -d \"C:\\Users\\victim\\AppData\\Roaming\\Microsoft\\Windows\\Recent\" --csv out",
        description:
          "Parses both AutomaticDestinations and CustomDestinations subfolders under ...\\Recent\\ into CSV: target file path, app ID, and open/access timestamps.",
        lookFor: "A per-app list of recently opened files/folders, useful even if the file itself was later deleted or moved.",
      },
    ],
    gotcha: "The folder name under AutomaticDestinations is an AppID hash, not the application's real name — mapping it back requires an AppID lookup table.",
    gotchaFix: "JLECmd itself resolves common AppIDs to friendly names in its CSV output; for unknown ones, cross-reference a public AppID list.",
    next: "Correlate recovered paths against LNK files and ShellBags for the same user activity.",
  }),
  entry({
    slug: "lnk-files",
    title: "LNK (Shortcut) Files",
    tags: ["lnk", "lecmd", "shortcut", "volume serial", "mac times"],
    task: "Recover the original target path, volume serial, MAC times, and sometimes the creating machine's identity from a shortcut file.",
    cmds: [
      {
        syntax: "LECmd.exe -d LNK_DIR --csv OUT_DIR",
        example: "LECmd.exe -d \"C:\\Users\\victim\\Desktop\" --csv out",
        description: "Parses .lnk files into CSV: target path, target MAC timestamps, volume serial number, and (if present) the NetBIOS machine name / MAC address of the system the shortcut was created on.",
        lookFor: "A target path pointing at removable/network media, or a machine name/MAC address that doesn't match the host you're investigating — evidence the file originated elsewhere.",
      },
    ],
    gotcha: "Not every LNK carries the machine-identifier fields — they're optional extra data blocks and depend on how/when the shortcut was created.",
    gotchaFix: "Treat the hostname/MAC fields as a bonus when present, not something to expect on every LNK.",
    next: "Cross-check the target path/volume serial against Jump Lists and USBSTOR registry entries for the same device.",
  }),
  entry({
    slug: "recycle-bin-artifacts",
    title: "Recycle Bin Artifacts",
    tags: ["recycle bin", "rbcmd", "$i", "$r", "deleted files", "sid"],
    task: "Recover original path, delete time, and size of deleted files, paired with their actual content.",
    cmds: [
      {
        syntax: "RBCmd.exe -d RECYCLEBIN_DIR --csv OUT_DIR",
        example: "RBCmd.exe -d \"C:\\$Recycle.Bin\\S-1-5-21-...\" --csv out",
        description:
          "Windows 10+ stores each deleted item as a pair under $Recycle.Bin\\<user SID>\\: $Ixxxx (metadata — original path, delete timestamp, size) and $Rxxxx (the actual deleted file content). RBCmd parses the $I files into CSV and links each to its $R pair.",
        lookFor: "Original path and delete time from $I; recover the content itself from the matching $R file.",
      },
    ],
    gotcha: "The SID-named subfolder maps to a specific user account; deleted items from different users land in different SID folders, so you must check all of them, not just one.",
    gotchaFix: "Enumerate every SID subfolder under $Recycle.Bin and resolve each SID to a username (via the SAM hive or `wmic useraccount`) rather than assuming a single folder covers all users.",
    next: "Hash-recover or open the matched $R content and confirm it against the $I metadata's original path/size.",
  }),
  entry({
    slug: "srum-analysis",
    title: "SRUM Analysis",
    tags: ["srum", "srudb", "srum-dump", "srumecmd", "network usage"],
    task: "Recover per-app network usage and execution history that survives even after Prefetch/Shimcache don't.",
    cmds: [
      {
        syntax: "srum-dump.py -i SRUDB_PATH -r SOFTWARE_HIVE_PATH -o OUT_XLSX",
        example: "srum-dump.py -i SRUDB.dat -r SOFTWARE -o out.xlsx",
        description:
          "SRUM data lives at C:\\Windows\\System32\\sru\\SRUDB.dat and tracks per-application network bytes sent/received and execution over rolling time windows. srum-dump.py (Mark Baggett) needs the SOFTWARE hive alongside SRUDB.dat to resolve app IDs to friendly names; SrumECmd.exe (EZ Tools) is the alternative that doesn't require passing the hive separately.",
        lookFor: "An app with network activity or execution entries in a time window where Prefetch/Shimcache show nothing (SRUM often retains data longer).",
      },
    ],
    gotcha: "Without the matching SOFTWARE hive, srum-dump.py can't resolve application IDs to readable names — you'll just get opaque GUIDs/IDs.",
    gotchaFix: "Always pull SOFTWARE alongside SRUDB.dat, or use SrumECmd which bundles its own ID-resolution logic.",
    next: "Correlate SRUM's network/execution windows against the rest of the timeline once names are resolved.",
  }),
  entry({
    slug: "shellbags",
    title: "ShellBags",
    tags: ["shellbags", "sbecmd", "bagmru", "folder browsing", "usrclass"],
    task: "Track folders a user browsed in Explorer, including ones since deleted or on removed media.",
    cmds: [
      {
        syntax: "SBECmd.exe -d HIVE_DIR --csv OUT_DIR",
        example: "SBECmd.exe -d C:\\Users\\victim\\ --csv out",
        description:
          "ShellBags are stored in NTUSER.DAT and UsrClass.dat under Software\\Microsoft\\Windows\\Shell\\BagMRU. SBECmd (or the ShellBags Explorer GUI) parses both hives into CSV covering every folder path the user's Explorer window state remembers.",
        lookFor: "A folder path for removable/network media or a now-deleted directory that no longer exists on disk — ShellBags retain it as proof it was once browsed.",
      },
    ],
    gotcha: "ShellBags entries don't reliably record when a folder was browsed — only that it was; timestamp fields are inconsistent across Windows versions.",
    gotchaFix: "Use ShellBags for \"this folder/device was accessed at some point\" evidence, and get timing from LNK/Jump List/Prefetch entries referencing the same path instead.",
    next: "Cross-reference recovered paths against LNK files, Jump Lists, and USBSTOR for device/media correlation.",
  }),
  entry({
    slug: "scheduled-tasks",
    title: "Scheduled Tasks",
    tags: ["scheduled tasks", "taskcache", "xml", "persistence", "exec", "triggers"],
    task: "Find persistence or malicious automation defined as a scheduled task.",
    cmds: [
      {
        syntax: "type \"C:\\Windows\\System32\\Tasks\\TASK_NAME\"",
        example: "type \"C:\\Windows\\System32\\Tasks\\UpdateCheck\"",
        description:
          "Task definitions are plain XML files with no extension under C:\\Windows\\System32\\Tasks\\ — `type` (or any text viewer) reads them directly. The registry mirrors task metadata at SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tree.",
        lookFor: "<Actions><Exec><Command> for the actual program/command run, and <Triggers> (TimeTrigger, LogonTrigger, BootTrigger...) for when/how often it fires — both are strong persistence indicators if unexpected.",
      },
    ],
    gotcha: "Task folders mirror the Task Scheduler's folder structure (subfolders under Tasks\\), so a `dir /s` or recursive search is needed — a flat listing of the top-level Tasks\\ directory misses nested tasks.",
    gotchaFix: "Recurse the whole Tasks directory tree (`dir /s /b C:\\Windows\\System32\\Tasks`), not just the top level, and cross-check against the TaskCache\\Tree registry key for tasks that were deleted from disk but left registry remnants.",
    next: "Pivot on the <Command>/<Arguments> value — check it against Prefetch/Amcache for execution proof and against hash/IOC lists.",
  }),
  entry({
    slug: "rdp-connection-history",
    title: "RDP Connection History",
    tags: ["rdp", "terminal services", "4624", "logon type 10", "event id 21", "event id 25"],
    task: "Determine RDP connections made from this host (client side) or received by it (server side).",
    cmds: [
      {
        syntax: "rip.pl -r NTUSER.DAT -f ntuser (then check Terminal Server Client\\Servers)",
        example: "rip.pl -r NTUSER.DAT -f ntuser",
        description:
          "Client-side RDP history sits in NTUSER.DAT under Software\\Microsoft\\Terminal Server Client\\Servers — one subkey per remote host ever connected to, listing the hostname/IP (MRU-ordered, no reliable per-connection timestamp).",
        lookFor: "A server subkey for a host this user shouldn't be RDPing to.",
      },
      {
        syntax: "wevtutil qe Security.evtx /q:\"*[System[(EventID=4624)]]\" (filter for Logon Type 10)",
        example: "wevtutil qe Security.evtx /q:\"*[System[(EventID=4624) and EventData[Data[@Name='LogonType']='10']]]\" /f:text",
        description:
          "Server-side: Event ID 4624 with Logon Type 10 (RemoteInteractive) in the Security log confirms an interactive RDP logon, with source IP and account name. Microsoft-Windows-TerminalServices-LocalSessionManager%4Operational.evtx Event ID 21 (session logon succeeded) / 25 (session reconnection) corroborate session start/resume times.",
        lookFor: "A 4624/LogonType 10 entry with its matching Event ID 21/25 session entry — the pair gives account, source IP, and precise session timing.",
      },
    ],
    gotcha: "4624 Logon Type 10 alone doesn't distinguish a genuinely remote RDP session from a local console session that happens to report type 10 in some older OS builds; it also doesn't confirm success if MFA/NLA intercepted the auth differently.",
    gotchaFix: "Corroborate with the LocalSessionManager%4Operational log's own Event ID 21/25 entries and the source IP field on 4624, rather than trusting 4624 alone.",
    next: "Cross-reference the RDP session window against Prefetch/Amcache execution evidence on the target host for what the attacker actually did once connected.",
  }),
];
