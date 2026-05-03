"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import useSWR from "swr";
import ReactMarkdown from "react-markdown";
import { FileText, Lightbulb, Loader2, Send, Upload } from "lucide-react";

import {
  askQuestion,
  fetchDocuments,
  fetchInsights,
  refreshInsights,
  uploadFile,
  type DocumentSummary,
  type Insight,
  type SourceReference,
} from "@/lib/api";

type Message = {
  role: "user" | "ai";
  content: string;
  sources?: SourceReference[];
};

export default function CopilotDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs, mutate: mutateDocs } = useSWR<DocumentSummary[]>("/docs", fetchDocuments);
  const { data: insights, mutate: mutateInsights } = useSWR<Insight[]>("/insights", fetchInsights);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    setUploading(true);
    try {
      await uploadFile(event.target.files[0]);
      await mutateDocs();
      await mutateInsights(await refreshInsights(), { revalidate: false });
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload document.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRefreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      await mutateInsights(await refreshInsights(), { revalidate: false });
    } catch (error) {
      console.error("Insight refresh failed", error);
      alert("Failed to refresh insights.");
    } finally {
      setRefreshingInsights(false);
    }
  };

  const handleAskQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await askQuestion(userMessage.content);
      setMessages((previous) => [
        ...previous,
        { role: "ai", content: data.answer, sources: data.sources },
      ]);
    } catch (error) {
      console.error("Question failed", error);
      setMessages((previous) => [
        ...previous,
        { role: "ai", content: "Error connecting to AI backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <aside className="flex w-80 flex-col gap-6 overflow-y-auto border-r bg-white p-4">
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Lightbulb className="text-blue-600" /> Knowledge Base
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            Upload Document
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.md"
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
            Indexed Documents
          </h3>
          <ul className="space-y-2 text-sm">
            {docs?.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 rounded bg-gray-100 p-2 text-gray-700">
                <FileText size={16} className="shrink-0 text-gray-500" />
                <span className="truncate">{doc.title}</span>
              </li>
            ))}
            {!docs?.length && <p className="italic text-gray-400">No documents uploaded yet.</p>}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Latest Insights
            </h3>
            <button
              type="button"
              onClick={handleRefreshInsights}
              disabled={refreshingInsights}
              className="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {refreshingInsights ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {insights?.slice(0, 3).map((insight) => (
              <div key={insight.id} className="rounded bg-amber-50 p-3 text-amber-900">
                <p className="font-medium">{insight.title}</p>
                <p className="mt-1 line-clamp-3 text-xs text-amber-800">{insight.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-amber-700">
                  {new Date(insight.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {!insights?.length && <p className="italic text-gray-400">Insights will appear after ingestion.</p>}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Upload a document to the left, then ask me anything about it.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-lg p-4 shadow-sm ${
                    message.role === "user" ? "bg-blue-600 text-white" : "border bg-white"
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-semibold text-gray-500">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, sourceIndex) => (
                          <span
                            key={`${source.chunk_id}-${sourceIndex}`}
                            className="cursor-help rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                            title={source.snippet}
                          >
                            {source.document_title} (Chunk {source.chunk_index})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-gray-500 shadow-sm">
                <Loader2 className="animate-spin" size={18} /> Retrieving context...
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <form onSubmit={handleAskQuestion} className="relative mx-auto max-w-4xl">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your documents..."
              className="w-full rounded-full border py-3 pl-4 pr-12 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 rounded-full bg-blue-600 p-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
