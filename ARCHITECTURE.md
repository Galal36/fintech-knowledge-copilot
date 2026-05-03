# Architecture Overview

This document will capture the system design, data flow, scaling approach, and implementation trade-offs for the FinTech Knowledge Copilot.

## Planned Architecture

- Modular monolith backend with clear service boundaries
- PostgreSQL for operational data and metadata
- ChromaDB for vector storage and semantic retrieval
- Next.js frontend for document management, AI copilot, and insights dashboard
- Docker Compose for local orchestration

## Planned Data Flow

1. User uploads files or submits simulated external knowledge sources.
2. Backend extracts text, chunks content, and generates embeddings.
3. Document metadata is stored in PostgreSQL and embeddings are stored in ChromaDB.
4. User queries trigger retrieval, prompt construction, and grounded LLM answering.
5. Insight generation scans the knowledge base and stores structured insight records.

## Trade-off Direction

- Prioritize a strong local demo over premature production distribution
- Keep the initial system as a modular monolith for speed and clarity
- Use provider abstractions to keep Gemini replaceable in future iterations
