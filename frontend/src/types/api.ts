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

export type Chunk = {
  id: string;
  chunk_index: number;
  text: string;
  token_count: number;
  metadata: Record<string, unknown>;
};

export type DocumentDetail = DocumentSummary & {
  chunks: Chunk[];
};

export type SourceCitation = {
  document_id: string;
  document_title: string;
  chunk_id: string;
  chunk_index: number;
  snippet: string;
  score: number;
};

export type QueryResponse = {
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  reasoning: string | null;
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

export type SourceIngestPayload = {
  title: string;
  content: string;
  source_name: string;
  metadata: Record<string, unknown>;
};
