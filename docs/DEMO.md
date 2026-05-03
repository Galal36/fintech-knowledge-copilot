# Demo Flow

## Fast Walkthrough

1. Start the system with `docker compose up --build`.
2. Open `http://localhost:3000`.
3. Upload one `.md` or `.txt` file from the Overview page.
4. Ingest the simulated external source from the same page.
5. Open Documents and inspect processed chunk previews.
6. Open Copilot and ask a question about pricing, support issues, or decisions.
7. Show the source panel and confidence note.
8. Open Insights and walk through generated proactive cards.

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
