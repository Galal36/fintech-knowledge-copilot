# FinTech Knowledge Copilot

Production-quality MVP for the interview task "AI Knowledge Operations System". The project ingests files and simulated external knowledge, stores document metadata in PostgreSQL, stores semantic chunks in ChromaDB, answers grounded questions with cited sources, and surfaces proactive insights.

## Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, ChromaDB
- AI: Gemini API with deterministic fallbacks when no API key is present
- Frontend: Next.js App Router, Tailwind CSS, React Query
- Infra: Docker Compose

## Repository Structure

```text
backend/             FastAPI app, models, services, tests
frontend/            Next.js UI for upload, documents, copilot, and insights
infra/               Alternate compose location for infrastructure setup
docs/                Additional docs and sample notes
docker-compose.yml   Root local orchestration entry point
.env.example         Local environment template
ARCHITECTURE.md      System design and trade-offs
```

## Features

- Upload `.pdf`, `.txt`, `.md` files
- Simulate external data ingestion with JSON content
- Extract, normalize, and chunk text
- Store document metadata and chunk metadata in PostgreSQL
- Store semantic vectors in ChromaDB
- Query knowledge with grounded answers and cited sources
- Stream answers to the frontend
- Generate proactive insights from stored chunks
- Browse documents and inspect chunk-level source material

## Required Endpoints

- `POST /api/ingest/files`
- `POST /api/ingest/source`
- `GET /api/docs`
- `GET /api/docs/{id}`
- `POST /api/ai/query`
- `GET /api/ai/insights`

## Local Setup

1. Copy the env template.

```bash
cp .env.example .env
```

2. Add your Gemini API key to `.env` if you want real Gemini generation and embeddings.

3. Start the stack from the repository root.

```bash
docker compose up --build
```

4. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Notes About AI Behavior

- If `GEMINI_API_KEY` is configured, the backend uses Gemini for embeddings, summaries, answers, and insights.
- If the key is missing or Gemini calls fail, the system falls back to deterministic local embeddings and extractive summaries so the MVP still runs end to end.

## Suggested Demo Flow

1. Upload a markdown or text document from the dashboard.
2. Ingest a simulated Slack or Notion payload.
3. Open the Documents page and inspect processed chunks.
4. Ask a grounded question in the Copilot page.
5. Review cited sources and confidence.
6. Open the Insights page to show proactive summaries.

## Backend Notes

- Tables are created automatically on app startup.
- The backend is intentionally a modular monolith for same-day delivery speed and clean boundaries.
- Chroma persistence and upload storage are mounted as Docker volumes.

## Testing

Minimal smoke test:

```bash
cd backend
pytest
```

## What Is Still Intentionally Lightweight

- No authentication
- No distributed job queue
- No production deployment manifests
- No advanced reranker or hybrid BM25 layer

Those are covered as next steps in `ARCHITECTURE.md`.

## AI Assistance Disclosure

AI tools were used as a support aid during implementation, debugging, and trade-off evaluation. The final code, architecture, and debugging decisions were reviewed and understood as part of the build process.

Example prompts used during development:

1. `Help me specifying the best stack to this project. I prefer to work using Django, as I have experience in it, but I guess the best option is FastAPI.`
2. `I used to use validation and serializers in Django. What is the best option to use in FastAPI to validate?`
3. `Which vector DB should I use to make the process faster, Chroma or Pinecone?`
4. `The insights do not work and I suspect that the error comes from SQLAlchemy.`
