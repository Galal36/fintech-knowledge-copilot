# Demo Flow

## Fast Walkthrough

1. Start the system with `docker compose up --build`.
2. Open `http://localhost:3000`.
3. Upload one `.md` or `.txt` file from the dashboard (for example `docs/sample_knowledge.md`).
4. Ingest a simulated external source with `POST /api/ingest/source` (Swagger UI at `http://localhost:8000/docs`).
5. Check the Indexed Documents panel for the processed documents.
6. Ask the copilot a question about pricing, support issues, or decisions.
7. Show the cited sources and the confidence note under the answer.
8. Refresh the Latest Insights panel and walk through the generated insight cards.

## Good Questions To Ask

- What pricing decisions were discussed across the uploaded knowledge?
- What recurring issues appear in the support-related material?
- Is there any conflicting information in the stored content?

## What To Emphasize In Review

- modular monolith for speed and clarity
- PostgreSQL for metadata, ChromaDB for semantic retrieval
- grounded answers with citations instead of unsupported generation
- graceful fallback behavior when Gemini is unavailable
- designed for local demo first, with clear path to production hardening
