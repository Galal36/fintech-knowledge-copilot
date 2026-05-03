"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/documents", label: "Documents" },
  { href: "/copilot", label: "Copilot" },
  { href: "/insights", label: "Insights" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
      <aside className="glass-panel hidden w-72 shrink-0 rounded-[28px] p-6 md:flex md:flex-col">
        <div>
          <p className="section-title">FinTech Company</p>
          <h1 className="mt-3 text-2xl font-semibold">Knowledge Ops Copilot</h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Ingest files, query knowledge, and surface proactive insights from internal context.
          </p>
        </div>
        <nav className="mt-10 flex flex-col gap-2">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-white/60 text-[color:var(--foreground)] hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-3xl bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--muted)]">
          Designed as a same-day production-quality MVP with grounded retrieval and clear source traceability.
        </div>
      </aside>
      <main className="flex-1">
        <header className="mb-6 rounded-[28px] border border-[color:var(--border)] bg-white/70 px-6 py-5">
          <p className="section-title">Mission Control</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">{subtitle}</p>
            </div>
            <div className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--muted)]">
              Local-first demo with FastAPI, PostgreSQL, ChromaDB, Gemini
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
