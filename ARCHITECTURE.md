# Architecture

## Goal

Build a same-day MVP that demonstrates strong full-stack judgment, credible AI integration, good API design, and clean system boundaries without drifting into overengineering.

## High-Level Architecture

The system is implemented as a modular monolith:

- FastAPI handles ingestion, retrieval, and insights APIs
- PostgreSQL stores document metadata, chunk metadata, and insight records
- ChromaDB stores semantic embeddings for chunk retrieval
- Gemini handles embeddings, summarization, answer generation, and insight generation when configured
- Next.js provides a multi-view operator UI for ingestion, document browsing, copilot usage, and proactive insights

## Why Modular Monolith

For a same-day interview task, a modular monolith is the best trade-off:

- fast to ship
- easier to debug locally
- still shows clear boundaries between ingestion, retrieval, LLM, and UI concerns
- straightforward to split later into API, worker, and retrieval services

## Data Flow

### 1. Ingestion

1. User uploads files or submits simulated external content.
2. Backend extracts and normalizes text.
3. Text is chunked with overlap.
4. Document record is saved in PostgreSQL.
5. Chunk records are saved in PostgreSQL.
6. Embeddings are generated and stored in ChromaDB.
7. The frontend can inspect processed chunks for traceability.

### 2. Retrieval + Reasoning

1. User submits a question.
2. Backend embeds the query.
3. ChromaDB returns top matching chunks.
4. PostgreSQL resolves chunk metadata and document traceability.
5. Gemini receives the question plus grounded context snippets.
6. Backend returns answer, sources, confidence, and reasoning notes.
7. Streaming mode emits incremental tokens for a better copilot UX.

### 3. Proactive Insights

1. Backend samples stored chunks.
2. Chunk evidence is grouped into rough topic buckets.
3. Gemini generates structured insight candidates.
4. Insights are stored in PostgreSQL and displayed in the dashboard.

## API Design

### Ingestion

- `POST /api/ingest/files`
- `POST /api/ingest/source`

### Documents

- `GET /api/docs`
- `GET /api/docs/{id}`

### AI

- `POST /api/ai/query`
- `GET /api/ai/insights`

The query endpoint supports streaming through `?stream=true` and returns newline-delimited JSON events for frontend consumption.

## Database Design

### `documents`

- one row per ingested source
- stores source type, content hash, summary, status, and metadata

### `document_chunks`

- one row per text chunk
- stores document linkage, chunk index, chunk text, and Chroma identifier

### `insights`

- stores structured proactive intelligence cards and supporting references

## Reliability Decisions

- content hash deduplication prevents duplicate re-ingestion
- source citations are returned with every answer
- if Gemini is unavailable, the system falls back to deterministic local embeddings and extractive answers
- Chroma query failures degrade safely to empty retrieval instead of crashing the API
- logging is enabled centrally and errors are surfaced with readable API responses

## Performance Decisions

- chunks are persisted and reused instead of reprocessing on each query
- document metadata is kept in PostgreSQL for efficient listing and debugging
- vector search stays in Chroma to keep retrieval simple and fast for the MVP
- streaming answers reduce perceived latency in the frontend

## Trade-Offs

### Chroma instead of pgvector

Chosen because it is faster to wire in a same-day MVP and keeps vector concerns isolated. If this system matured, consolidating into PostgreSQL with `pgvector` could improve operational simplicity.

### No background worker yet

Ingestion and insight generation run inline for simplicity. In production, these should move to a queue-backed worker for better latency isolation and retry control.

### Heuristic confidence

Confidence is currently derived from semantic match strength and should be described as heuristic rather than statistically calibrated.

## How This Would Scale Next

- move ingestion and insight generation into worker processes
- add scheduled jobs for periodic insight refresh
- add query logging and feedback loops
- add hybrid retrieval with keyword search plus vector search
- add reranking and query rewriting
- add auth, tenancy, and per-organization collections
- add observability dashboards and structured tracing
