"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { getDocument, getDocuments } from "@/lib/api";

export function DocumentBrowser() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const documents = documentsQuery.data ?? [];
  const activeId = selectedId ?? documents[0]?.id ?? null;

  const detailQuery = useQuery({
    queryKey: ["document", activeId],
    queryFn: () => getDocument(activeId as string),
    enabled: Boolean(activeId),
  });

  const selectedDocument = detailQuery.data;
  const statusText = useMemo(() => {
    if (documentsQuery.isLoading) {
      return "Loading documents...";
    }
    if (documentsQuery.isError) {
      return "Failed to load documents.";
    }
    return `${documents.length} documents available`;
  }, [documents.length, documentsQuery.isError, documentsQuery.isLoading]);

  return (
    <AppShell
      title="Document Intelligence"
      subtitle="Browse ingested assets, inspect processed chunks, and verify that the retrieval layer has traceable source material."
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="glass-panel rounded-[28px] p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-title">Knowledge Base</p>
              <h3 className="mt-2 text-xl font-semibold">Stored documents</h3>
            </div>
            <span className="text-sm text-[color:var(--muted)]">{statusText}</span>
          </div>
          <div className="mt-6 space-y-3">
            {documents.map((document) => {
              const active = document.id === activeId;
              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setSelectedId(document.id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                      : "border-[color:var(--border)] bg-white/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-medium">{document.title}</h4>
                    <span className="text-xs text-[color:var(--muted)]">{document.chunk_count} chunks</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {document.summary || "No summary available."}
                  </p>
                </button>
              );
            })}
            {!documents.length && (
              <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[color:var(--muted)]">
                No documents found. Use the overview page to ingest content first.
              </p>
            )}
          </div>
        </section>
        <section className="glass-panel rounded-[28px] p-6">
          {selectedDocument ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-title">Document Detail</p>
                  <h3 className="mt-2 text-2xl font-semibold">{selectedDocument.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {selectedDocument.source_type} • {selectedDocument.status} •{" "}
                    {selectedDocument.external_source_name || selectedDocument.file_name || "local content"}
                  </p>
                </div>
                <div className="rounded-3xl bg-white px-4 py-3 text-sm text-[color:var(--muted)]">
                  Created {new Date(selectedDocument.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-white/70 p-5">
                <p className="section-title">Summary</p>
                <p className="mt-3 leading-7 text-[color:var(--foreground)]">
                  {selectedDocument.summary || "No generated summary available."}
                </p>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="section-title">Processed Chunks</p>
                    <h4 className="mt-2 text-lg font-semibold">Grounding context</h4>
                  </div>
                  <span className="text-sm text-[color:var(--muted)]">
                    {selectedDocument.chunks.length} chunks
                  </span>
                </div>
                <div className="max-h-[680px] space-y-3 overflow-auto pr-1">
                  {selectedDocument.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-3xl border border-[color:var(--border)] bg-white/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs text-[color:var(--accent-strong)]">
                          Chunk {chunk.chunk_index}
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          ~{chunk.token_count} tokens
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--muted)]">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-[color:var(--border)] px-4 py-10 text-sm text-[color:var(--muted)]">
              Select a document to inspect its processed chunks.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
