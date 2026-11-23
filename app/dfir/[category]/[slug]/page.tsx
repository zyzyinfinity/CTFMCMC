import { notFound } from "next/navigation";
import { findTechnique } from "@/lib/content";
import { dfirTechniques } from "@/lib/content/dfir";
import TechniqueView from "@/components/TechniqueView";

export function generateStaticParams() {
  return dfirTechniques.map((t) => ({ category: t.category, slug: t.slug }));
}

export default async function DfirTechniquePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const technique = findTechnique("dfir", category, slug);
  if (!technique) notFound();
  return <TechniqueView technique={technique} />;
}
