import { notFound } from "next/navigation";
import { findTechnique } from "@/lib/content";
import { b2rTechniques } from "@/lib/content/b2r";
import TechniqueView from "@/components/TechniqueView";

export function generateStaticParams() {
  return b2rTechniques.map((t) => ({ category: t.category, slug: t.slug }));
}

export default async function B2RTechniquePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const technique = findTechnique("b2r", category, slug);
  if (!technique) notFound();
  return <TechniqueView technique={technique} />;
}
