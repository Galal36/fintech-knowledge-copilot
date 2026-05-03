"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { UploadPanel } from "@/components/upload-panel";
import { getDocuments, getInsights } from "@/lib/api";

export function DashboardPage() {
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
  const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
  });

  const documents = documentsQuery.data ?? [];
  const insights = insightsQuery.data ?? [];

  return (
    <AppShell
      title="Operational Overview"
      subtitle="A single workspace for ingestion, retrieval, and proactive AI insight generation."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Documents" value={String(documents.length)} accent="Knowledge base size" />
            <MetricCard
              label="Insights"
              value={String(insights.length)}
              accent="Generated from stored chunks"
            />
            <MetricCard
              label="Status"
              value="Ready"
              accent="Local-first operator workflow"
            />
          </section>
          <UploadPanel />
          <section className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Recent Documents</p>
                <h3 className="mt-2 text-xl font-semibold">Knowledge base activity</h3>
              </div>
              <Link href="/documents" className="text-sm font-medium text-[color:var(--accent)]">
                View all
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {documents.slice(0, 5).map((document) => (
                <div
                  key={document.id}
                  className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{document.title}</h4>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {document.source_type} • {document.chunk_count} chunks
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs text-[color:var(--accent-strong)]">
                      {document.status}
                    </span>
                  </div>
                </div>
              ))}
              {!documents.length && (
                <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[color:var(--muted)]">
                  No documents have been ingested yet. Start with a file upload or simulated external source.
                </p>
              )}
            </div>
          </section>
        </div>
        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Insight Feed</p>
              <h3 className="mt-2 text-xl font-semibold">Proactive signals</h3>
            </div>
            <Link href="/insights" className="text-sm font-medium text-[color:var(--accent)]">
              Open dashboard
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {insights.slice(0, 4).map((insight) => (
              <div
                key={insight.id}
                className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-700">
                    {insight.type}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <h4 className="mt-3 font-semibold">{insight.title}</h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{insight.description}</p>
              </div>
            ))}
            {!insights.length && (
              <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[color:var(--muted)]">
                Insights will appear after documents are ingested and processed.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass-panel rounded-[28px] p-5">
      <p className="section-title">{label}</p>
      <div className="mt-4 text-4xl font-semibold">{value}</div>
      <p className="mt-2 text-sm text-[color:var(--muted)]">{accent}</p>
    </div>
  );
}
