import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export type SourceReference = {
  document_id: string;
  document_title: string;
  chunk_id: string;
  chunk_index: number;
  snippet: string;
  score: number;
};

export type DocumentSummary = {
  id: string;
  title: string;
  source_type: string;
  file_name: string | null;
  mime_type: string | null;
  external_source_name: string | null;
  status: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  chunk_count: number;
};

export type Insight = {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  supporting_references: Record<string, unknown>[];
  created_at: string;
};

export type QueryResult = {
  answer: string;
  sources: SourceReference[];
  confidence: number;
  reasoning?: string | null;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("files", file);
  const response = await apiClient.post("/ingest/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as DocumentSummary[];
};

export const fetchInsights = async () => {
  const response = await apiClient.get("/ai/insights");
  return response.data as Insight[];
};

export const fetchDocuments = async () => {
  const response = await apiClient.get("/docs");
  return response.data as DocumentSummary[];
};

export const askQuestion = async (question: string) => {
  const response = await apiClient.post("/ai/query", { question });
  return response.data as QueryResult;
};
