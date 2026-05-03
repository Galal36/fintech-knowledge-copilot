"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { ingestFiles, ingestSource } from "@/lib/api";

export function UploadPanel() {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);
  const [sourceTitle, setSourceTitle] = useState("Slack Pricing Sync");
  const [sourceName, setSourceName] = useState("slack_simulation");
  const [sourceContent, setSourceContent] = useState(
    "Pricing team decided to test premium bundles for merchants with low churn. Support highlighted repeated issues around refund policy messaging."
  );
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFileUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files?.length) {
      setStatus("Choose one or more .pdf, .txt, or .md files first.");
      return;
    }

    setSubmitting(true);
    setStatus("Uploading and processing files...");
    try {
      await ingestFiles(Array.from(files));
      setStatus("Files ingested successfully.");
      setFiles(null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : "File ingestion failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSourceIngest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Ingesting simulated external source...");
    try {
      await ingestSource({
        title: sourceTitle,
        source_name: sourceName,
        content: sourceContent,
        metadata: { channel: sourceName, kind: "simulated_external" },
      });
      setStatus("External source ingested successfully.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    } catch (caughtError) {
      setStatus(caughtError instanceof Error ? caughtError.message : "Source ingestion failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="glass-panel rounded-[28px] p-6">
      <div className="flex flex-col gap-2">
        <p className="section-title">Ingestion Command Center</p>
        <h3 className="text-xl font-semibold">Feed the knowledge system</h3>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Upload files or simulate external sources such as Slack and Notion exports to populate the vectorized knowledge base.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleFileUpload} className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
          <p className="text-sm font-medium">Upload files</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Accepted: `.pdf`, `.txt`, `.md`</p>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            onChange={(event) => setFiles(event.target.files)}
            className="mt-4 block w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Process files
          </button>
        </form>

        <form onSubmit={handleSourceIngest} className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
          <p className="text-sm font-medium">Simulated external source</p>
          <div className="mt-4 grid gap-3">
            <input
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder="Source title"
              className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
            />
            <input
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="Source name"
              className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
            />
            <textarea
              value={sourceContent}
              onChange={(event) => setSourceContent(event.target.value)}
              rows={5}
              placeholder="Paste simulated Slack / Notion / meeting knowledge..."
              className="rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 outline-none focus:border-[color:var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Ingest source
          </button>
        </form>
      </div>

      {status && (
        <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-[color:var(--muted)]">
          {status}
        </div>
      )}
    </section>
  );
}
