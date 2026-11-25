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
    category: "document-forensics",
    title: e.title,
    tags: ["document", "office", "pdf", ...e.tags],
    concept: e.task,
    whenToUse: [e.task],
    workflow: [{ label: "Extract/unpack the document, inspect the result, then re-check with `file`/`grep` before assuming nothing is hidden" }],
    commands: e.cmds.map((c) => ({
      ...c,
      whenToUse: e.task,
      nextStep: e.next,
    })),
    tools: [],
    findings: {
      interesting: e.cmds.map((c) => c.lookFor),
      howToValidate: ["Confirm the extracted/decoded content actually corresponds to the suspect object, not an unrelated one, before reporting it as a finding."],
    },
    nextStep: [e.next],
    troubleshooting: [
      {
        symptom: `Gotcha: ${e.gotcha}`,
        likelyCause: e.gotcha,
        verify: "Re-check the document/object type and structure before assuming the command failed.",
        fix: e.gotchaFix,
        recovery: "Re-run against the original document, not a partially-unpacked copy.",
        avoid: e.gotchaFix,
      },
    ],
  };
}

export const documentForensicsTechniques: Technique[] = [
  entry({
    slug: "pdf-hidden-objects-attachments",
    title: "PDF Hidden Objects & Attachments",
    tags: ["pdf", "qpdf", "qdf", "pdfdetach", "embedded files"],
    task: "Unpack a PDF into readable syntax and extract any embedded file attachments.",
    cmds: [
      {
        syntax: "qpdf --qdf --object-streams=disable IN.pdf OUT.qdf",
        example: "qpdf --qdf --object-streams=disable in.pdf out.qdf",
        description: "Rewrites the PDF into QDF form: objects laid out one per line in readable syntax, with compressed object streams disabled so every object is individually visible (not packed into an ObjStm). Install: apt install qpdf.",
        lookFor: "out.qdf opens in a text editor/less with readable object dictionaries (/Type /Page, /Type /Annot, etc.) instead of binary gibberish.",
      },
      {
        syntax: "pdfdetach -list IN.pdf",
        example: "pdfdetach -list in.pdf",
        description: "Lists every embedded file attachment (from poppler-utils) without extracting anything.",
        lookFor: "Any attachment listed, even one with an innocuous-looking name.",
      },
      {
        syntax: "pdfdetach -saveall IN.pdf",
        example: "pdfdetach -saveall in.pdf",
        description: "Extracts every listed attachment to the current directory.",
        lookFor: "Extracted files; run `file` on each regardless of its extension.",
      },
    ],
    gotcha: "`pdfdetach -list` only reports attachments embedded via the standard /EmbeddedFiles mechanism — data hidden in unreferenced objects or stream content isn't an \"attachment\" and won't show up here.",
    gotchaFix: "If -list shows nothing but the PDF is still suspiciously large/odd, move to PDF Stream Extraction to check object/stream content directly.",
    next: "Run `file` on every extracted attachment and continue on the matching forensics page for its type.",
  }),
  entry({
    slug: "pdf-stream-extraction",
    title: "PDF Stream Extraction",
    tags: ["pdf", "stream", "flate", "pikepdf", "decompress"],
    task: "Decompress PDF content streams (often Flate-compressed) to read or grep what's actually in them.",
    cmds: [
      {
        syntax: "qpdf --qdf IN.pdf OUT.qdf  (then grep for /Type/Stream objects)",
        example: "qpdf --qdf in.pdf out.qdf; grep -n '/Type' out.qdf | grep Stream",
        description: "QDF form lays out each object with its dictionary visible even if the stream body itself stays compressed; locate /Type /Stream (or page-content, no explicit /Type) objects to decompress individually.",
        lookFor: "Object dictionaries with an unusually large /Length for what the page visually shows, or filters you don't expect (/Filter /FlateDecode stacked with something else).",
      },
      {
        syntax: "python3 -c \"import pikepdf;pikepdf.open('IN.pdf').save('OUT.pdf',compress_streams=False)\"",
        example: "python3 -c \"import pikepdf;pikepdf.open('in.pdf').save('out_decompressed.pdf',compress_streams=False)\"",
        description: "pikepdf (pip install pikepdf) rewrites the whole PDF with every stream decompressed to plaintext, in one call — easier than manually decoding each stream found via qpdf.",
        lookFor: "out_decompressed.pdf now greppable directly for strings/flags that were hidden inside compressed stream bytes.",
      },
    ],
    gotcha: "`qpdf --qdf` alone makes the PDF's *object structure* readable but does not necessarily decompress every content stream's bytes — you can still be grepping Flate-compressed binary inside an otherwise-readable object.",
    gotchaFix: "Use pikepdf's `compress_streams=False` (or `qpdf --qdf --decode-level=all`) when you need the stream bytes themselves to be plaintext-searchable, not just the object layout.",
    next: "grep the decompressed output for the flag format or expected string, then re-check any stream that still looks binary/encoded.",
  }),
  entry({
    slug: "pdf-redaction-bypass",
    title: "Improperly Redacted PDF Content",
    tags: ["pdf", "redaction", "black box", "annotation", "pdftotext", "pdfimages"],
    task: "Recover text hidden under a visual redaction box that was never actually removed from the document.",
    cmds: [
      {
        syntax: "pdftotext -layout IN.pdf OUT.txt",
        example: "pdftotext -layout in.pdf out.txt",
        description: "Extracts the PDF's actual text layer, preserving layout. A black box drawn as an annotation or a filled rectangle in the content stream doesn't remove the text underneath it — it only covers it visually.",
        lookFor: "The \"redacted\" text appearing in full in out.txt, exactly where the black box sits visually in the PDF.",
      },
      {
        syntax: "pdfimages -all IN.pdf img_",
        example: "pdfimages -all in.pdf img_",
        description: "Extracts every embedded image. Useful when the redaction itself is image-based (a small black rectangle image overlaid on a separate text/image layer) rather than a vector annotation — if the box comes out as its own small image file, the layer beneath it is a separate, removable object.",
        lookFor: "A small solid-colour image matching the box's size/position, separate from the page's main content — evidence the redaction is an overlay, not flattened pixels.",
      },
    ],
    gotcha: "If the document was properly redacted by flattening the page to a single raster image with the sensitive area genuinely erased (not just covered), there's no text layer or separate overlay object to recover — pdftotext returns nothing and pdfimages shows one flat image with no hidden layer underneath.",
    gotchaFix: "Don't keep retrying the same extraction if both commands come back empty/flat — confirm genuine flattening by checking `qpdf --qdf` shows no text operators and no stacked image objects at that page region before concluding nothing more can be recovered.",
    next: "If a vector/annotation overlay is found, delete that object with pikepdf/qpdf and re-render to confirm the text beneath is intact and complete.",
  }),
  entry({
    slug: "office-ooxml-extraction",
    title: "DOCX / XLSX / PPTX XML Extraction",
    tags: ["docx", "xlsx", "pptx", "ooxml", "unzip", "docprops", "customxml"],
    task: "Unpack an Office Open XML file (it's a ZIP) and search its raw XML parts for hidden content.",
    cmds: [
      {
        syntax: "unzip FILE_PATH -d EXTRACT_DIR",
        example: "unzip file.docx -d extracted/",
        description: ".docx/.xlsx/.pptx are ZIP archives; unzipping exposes word/document.xml (or xl/, ppt/ equivalents) as plain readable XML.",
        lookFor: "A normal OOXML folder structure ([Content_Types].xml, _rels/, word|xl|ppt/, docProps/, and sometimes customXml/).",
      },
      {
        syntax: "grep -r 'SEARCH_TERM' EXTRACT_DIR",
        example: "grep -r \"flag\" extracted/",
        description: "Searches every unpacked XML file at once for a search term, including the easily-overlooked docProps/ (author, title, company metadata) and customXml/ (app-specific custom data parts) folders.",
        lookFor: "A hit in an XML part outside the obvious document/sheet/slide content — metadata and customXml are common places challenge authors stash data since most tools don't render them.",
      },
    ],
    gotcha: "Checking only word/document.xml (or xl/worksheets/, ppt/slides/) misses data stashed in docProps/core.xml, docProps/custom.xml, or customXml/item*.xml, none of which render anywhere in the normal Office UI.",
    gotchaFix: "Always `grep -r` across the entire extracted directory, not just the main content part, when a search for the expected term/flag comes up empty.",
    next: "If the flag format is found in raw XML, extract it cleanly accounting for any XML-escaped characters (&amp; etc.).",
  }),
  entry({
    slug: "vba-macro-analysis",
    title: "VBA Macro Analysis",
    tags: ["vba", "macro", "olevba", "oletools", "autoopen", "deobfuscation"],
    task: "Extract and triage VBA macro source from a macro-enabled Office document.",
    cmds: [
      {
        syntax: "olevba FILE_PATH",
        example: "olevba file.docm",
        description: "From oletools (pip install oletools): dumps the full source of every VBA macro/module in the file, and auto-flags suspicious keywords (Shell, AutoOpen, AutoExec, CreateObject, Environ, Chr, etc.) in a results summary. Works the same on .xlsm/.pptm.",
        lookFor: "AutoOpen/AutoExec/Document_Open as the trigger, paired with Shell/CreateObject/WScript calls — the classic macro-dropper pattern.",
      },
      {
        syntax: "olevba --deobf FILE_PATH",
        example: "olevba --deobf file.docm",
        description: "Same extraction, but attempts automatic deobfuscation of string-concatenation/Chr-code obfuscated macro code before displaying it.",
        lookFor: "A readable deobfuscated string (often a URL, command line, or dropped-file path) where the raw source only showed Chr()/concatenation noise.",
      },
    ],
    gotcha: "olevba's keyword auto-flagging (and --deobf) is heuristic — a clean-looking report doesn't guarantee a macro is benign, and --deobf can fail silently on heavily custom obfuscation, leaving you looking at unresolved Chr()/string-math code.",
    gotchaFix: "Always read the actual macro source yourself, not just the keyword summary; if --deobf doesn't resolve it, manually evaluate the Chr()/concatenation logic (or run it in a sandboxed VBA debugger — never on the host).",
    next: "Pull out any URL/IP/command-line string the macro references and feed it into the IOC list; treat any dropped file reference as something to look for elsewhere in the evidence.",
  }),
  entry({
    slug: "hidden-worksheets-comments",
    title: "Hidden Worksheets & Document Comments",
    tags: ["xlsx", "hidden sheet", "veryhidden", "comments", "workbook.xml"],
    task: "Find worksheets hidden (including veryHidden, which Excel's UI can't even unhide) and document/cell comments.",
    cmds: [
      {
        syntax: "unzip FILE_PATH -d EXTRACT_DIR  (then check xl/workbook.xml)",
        example: "unzip file.xlsx -d ext/; grep -o '<sheet[^/]*/>' ext/xl/workbook.xml",
        description: "Each <sheet .../> entry in xl/workbook.xml carries a state attribute: absent/\"visible\" (normal), state=\"hidden\" (unhide-able via Excel's right-click), or state=\"veryHidden\" (not exposed anywhere in the Excel UI at all — only removable by editing this XML directly or via a VBA/script call).",
        lookFor: "Any <sheet .../> tag with state=\"hidden\" or state=\"veryHidden\" — the latter is the one most CTF challenges actually rely on, since it's invisible through normal use.",
      },
      {
        syntax: "cat EXTRACT_DIR/xl/comments*.xml   |   cat EXTRACT_DIR/word/comments.xml",
        example: "cat ext/xl/comments1.xml",
        description: "Excel stores cell comments in xl/comments1.xml, comments2.xml, etc. (one per sheet that has any); Word stores document comments in word/comments.xml.",
        lookFor: "Comment text that was deleted from view but still present in the XML, or a comment left by the challenge author as a hint/flag.",
      },
    ],
    gotcha: "To actually view a veryHidden sheet's content, changing state=\"veryHidden\" to state=\"visible\" in the XML and re-zipping is the fix — Excel's own \"Unhide Sheet\" dialog never lists veryHidden sheets, so trying that first wastes time.",
    gotchaFix: "Edit xl/workbook.xml directly (`sed`/text editor), re-zip the folder back into a valid .xlsx (`zip -r fixed.xlsx .` from inside the extracted folder), then open normally.",
    next: "Open the now-visible sheet / read the comment content, and check its cell references against the rest of the workbook for context.",
  }),
  entry({
    slug: "embedded-ole-objects",
    title: "Embedded OLE Objects",
    tags: ["ole", "oleid", "oledump", "compound binary", "embedded object"],
    task: "Triage and extract legacy/compound binary OLE objects embedded inside an Office document.",
    cmds: [
      {
        syntax: "oleid FILE_PATH",
        example: "oleid file.doc",
        description: "From oletools: triages the file's OLE structure and flags risk indicators (VBA macros present, embedded objects, encryption, etc.) in a summary table before you dig further.",
        lookFor: "Any flagged indicator worth following up — especially \"Has embedded files\" or \"VBA Macros\".",
      },
      {
        syntax: "oledump.py FILE_PATH",
        example: "oledump.py file.doc",
        description: "Lists every OLE stream in the file by index, with size and type hints (e.g. 'M' flag for a stream containing a VBA macro).",
        lookFor: "A stream index of interest — unusually large, flagged as a macro, or sized like a plausible embedded file.",
      },
      {
        syntax: "oledump.py -s STREAM_INDEX -d FILE_PATH > OUT.bin",
        example: "oledump.py -s 5 -d file.doc > out.bin",
        description: "Dumps one specific stream's (decompressed, if applicable) raw bytes to stdout.",
        lookFor: "`file out.bin` identifying a real embedded object type (another document, an image, an executable) rather than raw OLE directory noise.",
      },
    ],
    gotcha: "Running `oledump.py` without -s only lists streams — piping that listing output itself to `file` or treating it as the extracted object is a no-op; you must re-run with -s/-d to actually get the stream's bytes.",
    gotchaFix: "Always do the two-step: list first to pick the stream index, then re-run with -s N -d to dump that specific stream to a file.",
    next: "Run `file`/`strings` on the dumped stream and continue on the matching forensics page for whatever type it turns out to be.",
  }),
];
