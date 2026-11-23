import Link from "next/link";
import { notFound } from "next/navigation";
import { b2rCategories, techniquesForCategory } from "@/lib/content";

export function generateStaticParams() {
  return b2rCategories.map((c) => ({ category: c.slug }));
}

export default async function B2RCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = b2rCategories.find((c) => c.slug === category);
  if (!meta) notFound();
  const techniques = techniquesForCategory("b2r", category);

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-xs text-[var(--text-faint)]">Boot2Root</div>
      <h1 className="mb-2 text-xl font-semibold">{meta.title}</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">{meta.description}</p>

      {techniques.length === 0 ? (
        <p className="text-sm text-[var(--text-faint)]">No techniques published in this category yet.</p>
      ) : (
        <div className="space-y-2">
          {techniques.map((t) => (
            <Link
              key={t.slug}
              href={`/b2r/${category}/${t.slug}`}
              className="block rounded-md border p-3 hover:border-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="font-medium">{t.title}</h2>
              <p className="mt-0.5 text-sm text-[var(--text-dim)]">{t.concept}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
