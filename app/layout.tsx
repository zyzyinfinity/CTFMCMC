import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CTF Arsenal",
  description: "Personal Boot2Root & DFIR CTF reference manual.",
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('ctf-arsenal-theme');
    if (t === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-4 border-b px-4 py-2.5"
          style={{ borderColor: "var(--border)", background: "var(--bg)" }}
        >
          <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight">
            <span className="text-[var(--accent)]">CTF</span> Arsenal
          </Link>
          <div className="flex-1 max-w-xl">
            <SearchBar />
          </div>
          <ThemeToggle />
        </header>
        <nav
          aria-label="Main sections"
          className="overflow-x-auto border-b px-4 py-2"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mx-auto flex w-max gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide">
            {[
              ["/b2r", "Boot2Root"],
              ["/dfir", "Digital Forensics & IR"],
              ["/mistakes", "Command Mistakes & Recovery"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-md border px-3 py-1.5 text-[var(--text-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                style={{ borderColor: "var(--border)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex flex-1">
          <aside
            className="hidden md:block w-64 shrink-0 border-r"
            style={{ borderColor: "var(--border)" }}
          >
            <Sidebar />
          </aside>
          <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
