import Link from "next/link";
import { dfirCategories, techniquesForCategory } from "@/lib/content";
import Flowchart from "@/components/Flowchart";

export const metadata = { title: "DFIR — CTF Arsenal" };

export default function DfirOverview() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-xl font-semibold">Digital Forensics & Incident Response</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">
        Evidence-preserving investigation methodology: identify, extract, interpret, and correlate artifacts.
      </p>

      <div className="mb-8">
        <Flowchart
          title="Default investigation path"
          steps={["Evidence", "File Identification", "Metadata", "Signature Analysis", "Extraction", "Content Investigation", "IOC", "Flag"]}
        />
      </div>

      <div className="space-y-2">
        {dfirCategories.map((cat) => {
          const count = techniquesForCategory("dfir", cat.slug).length;
          return (
            <Link
              key={cat.slug}
              href={`/dfir/${cat.slug}`}
              className="block rounded-md border p-3 hover:border-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{cat.title}</h2>
                <span className="text-xs text-[var(--text-faint)]">{count} technique{count !== 1 ? "s" : ""}</span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--text-dim)]">{cat.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
