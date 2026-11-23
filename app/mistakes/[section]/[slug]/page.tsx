import { notFound } from "next/navigation";
import { allMistakes } from "@/lib/content";
import MistakeView from "@/components/MistakeView";

export function generateStaticParams() {
  return allMistakes.map((m) => ({ section: m.section, slug: m.slug }));
}

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  const mistake = allMistakes.find((m) => m.section === section && m.slug === slug);
  if (!mistake) notFound();
  return <MistakeView mistake={mistake} />;
}
