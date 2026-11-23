import Fuse, { IFuseOptions } from "fuse.js";
import { allTechniques, allMistakes, categoryTitle } from "./content";
import { Section } from "./content/types";

export interface SearchDoc {
  id: string;
  kind: "technique" | "mistake";
  section: Section;
  sectionLabel: string;
  category: string;
  categoryLabel: string;
  title: string;
  snippet: string;
  tags: string[];
  href: string;
}

function sectionLabel(section: Section): string {
  return section === "b2r" ? "Boot2Root" : "DFIR";
}

export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const t of allTechniques) {
    docs.push({
      id: `technique:${t.slug}`,
      kind: "technique",
      section: t.section,
      sectionLabel: sectionLabel(t.section),
      category: t.category,
      categoryLabel: categoryTitle(t.section, t.category),
      title: t.title,
      snippet: t.concept,
      tags: t.tags,
      href: `/${t.section}/${t.category}/${t.slug}`,
    });
  }

  for (const m of allMistakes) {
    docs.push({
      id: `mistake:${m.slug}`,
      kind: "mistake",
      section: m.section,
      sectionLabel: sectionLabel(m.section),
      category: "mistakes",
      categoryLabel: "Command Mistakes & Recovery",
      title: m.title,
      snippet: m.symptom,
      tags: m.tags,
      href: `/mistakes/${m.section}/${m.slug}`,
    });
  }

  return docs;
}

const fuseOptions: IFuseOptions<SearchDoc> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.35 },
    { name: "snippet", weight: 0.15 },
    { name: "categoryLabel", weight: 0.1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeMatches: true,
};

let fuseInstance: Fuse<SearchDoc> | null = null;

export function getFuse(): Fuse<SearchDoc> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(buildSearchDocs(), fuseOptions);
  }
  return fuseInstance;
}

export function searchDocs(query: string, limit = 30) {
  if (!query.trim()) return [];
  return getFuse()
    .search(query, { limit })
    .map((r) => r.item);
}
