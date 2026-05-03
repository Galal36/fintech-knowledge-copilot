import type {
  DocumentDetail,
  DocumentSummary,
  Insight,
  QueryResponse,
  SourceIngestPayload,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/docs`, {
    cache: "no-store",
  });
  return parseResponse<DocumentSummary[]>(response);
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await fetch(`${API_BASE_URL}/api/docs/${documentId}`, {
    cache: "no-store",
  });
  return parseResponse<DocumentDetail>(response);
}

export async function ingestFiles(files: File[]): Promise<DocumentSummary[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_BASE_URL}/api/ingest/files`, {
    method: "POST",
    body: formData,
  });
  return parseResponse<DocumentSummary[]>(response);
}

export async function ingestSource(payload: SourceIngestPayload): Promise<DocumentSummary> {
  const response = await fetch(`${API_BASE_URL}/api/ingest/source`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<DocumentSummary>(response);
}

export async function getInsights(): Promise<Insight[]> {
  const response = await fetch(`${API_BASE_URL}/api/ai/insights`, {
    cache: "no-store",
  });
  return parseResponse<Insight[]>(response);
}

export async function queryKnowledge(
  question: string,
  options?: { onToken?: (token: string) => void },
): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/query?stream=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || "Streaming query failed.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: QueryResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const payload = JSON.parse(line) as
        | { type: "token"; content: string }
        | { type: "final"; payload: QueryResponse };

      if (payload.type === "token") {
        options?.onToken?.(payload.content);
      }

      if (payload.type === "final") {
        finalPayload = payload.payload;
      }
    }
  }

  if (!finalPayload) {
    throw new Error("The stream completed without a final query payload.");
  }

  return finalPayload;
}
