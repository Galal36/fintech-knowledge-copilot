"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { getInsights } from "@/lib/api";

export function InsightsPage() {
  const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
  });

  const insights = insightsQuery.data ?? [];

  return (
    <AppShell
      title="Proactive Intelligence"
      subtitle="Signals generated from stored knowledge to help teams discover repeated issues, decisions, and potential conflicts."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight) => (
          <article key={insight.id} className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-700">
                {insight.type}
              </span>
              <span className="text-xs text-[color:var(--muted)]">
                {Math.round(insight.confidence * 100)}% confidence
              </span>
            </div>
            <h3 className="mt-4 text-xl font-semibold">{insight.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{insight.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {insight.supporting_references.map((reference, index) => (
                <span
                  key={`${insight.id}-${index}`}
                  className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs text-[color:var(--muted)]"
                >
                  {Object.values(reference).join(" • ")}
                </span>
              ))}
            </div>
          </article>
        ))}
        {!insights.length && (
          <div className="glass-panel rounded-[28px] p-6 text-sm text-[color:var(--muted)]">
            No insights are available yet. Ingest documents first to populate the proactive dashboard.
          </div>
        )}
      </div>
    </AppShell>
  );
}
