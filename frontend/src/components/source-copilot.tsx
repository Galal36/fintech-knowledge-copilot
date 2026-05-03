"use client";

import { FormEvent, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { queryKnowledge } from "@/lib/api";
import type { QueryResponse } from "@/types/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function SourceCopilot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setError(null);
    setLoading(true);
    setResult(null);
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: "user", content: currentQuestion },
      { id: crypto.randomUUID(), role: "assistant", content: "" },
    ]);

    try {
      const response = await queryKnowledge(currentQuestion, {
        onToken(token) {
          setMessages((previous) => {
            const next = [...previous];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              last.content += token;
            }
            return next;
          });
        },
      });
      setResult(response);
      setMessages((previous) => {
        const next = [...previous];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          last.content = response.answer;
        }
        return next;
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to query knowledge base.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="AI Copilot"
      subtitle="Ask grounded questions, watch the answer stream in, and inspect the exact sources used to support the response."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel flex min-h-[720px] flex-col rounded-[28px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Query Workspace</p>
              <h3 className="mt-2 text-xl font-semibold">Knowledge dialogue</h3>
            </div>
            {loading && (
              <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs text-[color:var(--accent-strong)]">
                Streaming
              </span>
            )}
          </div>

          <div className="mt-6 flex-1 space-y-4 overflow-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-[24px] px-4 py-4 text-sm leading-7 ${
                  message.role === "user"
                    ? "ml-auto bg-[color:var(--accent)] text-white"
                    : "bg-white/85 text-[color:var(--foreground)]"
                }`}
              >
                {message.content || (message.role === "assistant" ? "Thinking..." : "")}
              </div>
            ))}
            {!messages.length && (
              <div className="rounded-[24px] border border-dashed border-[color:var(--border)] px-5 py-8 text-sm text-[color:var(--muted)]">
                Try questions like: "What recurring pricing decisions appear across uploaded materials?" or
                "What conflicts exist in support or policy updates?"
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder="Ask a grounded question about the ingested knowledge base..."
              className="w-full rounded-[24px] border border-[color:var(--border)] bg-white/85 px-4 py-4 outline-none transition focus:border-[color:var(--accent)]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[color:var(--muted)]">
                Answers are grounded in retrieved chunks and cite their sources.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ask Copilot
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="glass-panel rounded-[28px] p-6">
            <p className="section-title">Grounding</p>
            <h3 className="mt-2 text-xl font-semibold">Source panel</h3>
            <div className="mt-5 space-y-3">
              {result?.sources.map((source) => (
                <div
                  key={source.chunk_id}
                  className="rounded-3xl border border-[color:var(--border)] bg-white/85 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{source.document_title}</h4>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        Chunk {source.chunk_index}
                      </p>
                    </div>
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs text-[color:var(--accent-strong)]">
                      {Math.round(source.score * 100)}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{source.snippet}</p>
                </div>
              ))}
              {!result?.sources.length && (
                <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[color:var(--muted)]">
                  Retrieved sources will appear here after a successful query.
                </p>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[28px] p-6">
            <p className="section-title">Confidence</p>
            <h3 className="mt-2 text-xl font-semibold">
              {result ? `${Math.round(result.confidence * 100)}%` : "Awaiting query"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              {result?.reasoning ||
                "The system calculates a heuristic confidence score from semantic match quality across retrieved chunks."}
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
