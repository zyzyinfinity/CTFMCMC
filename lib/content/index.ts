import { Technique, MistakeEntry, Section } from "./types";
import { b2rTechniques } from "./b2r";
import { dfirTechniques } from "./dfir";
import { mistakes } from "./mistakes";
import { b2rCategories, dfirCategories, categoriesFor } from "./categories";

export const allTechniques: Technique[] = [...b2rTechniques, ...dfirTechniques];
export const allMistakes: MistakeEntry[] = mistakes;

export { b2rCategories, dfirCategories, categoriesFor };

export function techniquesFor(section: Section): Technique[] {
  return section === "b2r" ? b2rTechniques : dfirTechniques;
}

export function techniquesForCategory(section: Section, category: string): Technique[] {
  return techniquesFor(section).filter((t) => t.category === category);
}

export function findTechnique(section: Section, category: string, slug: string): Technique | undefined {
  return techniquesFor(section).find((t) => t.category === category && t.slug === slug);
}

export function findTechniqueBySlug(slug: string): Technique | undefined {
  return allTechniques.find((t) => t.slug === slug);
}

export function mistakesFor(section: Section): MistakeEntry[] {
  return allMistakes.filter((m) => m.section === section);
}

export function findMistake(slug: string): MistakeEntry | undefined {
  return allMistakes.find((m) => m.slug === slug);
}

export function categoryTitle(section: Section, category: string): string {
  return categoriesFor(section).find((c) => c.slug === category)?.title ?? category;
}
