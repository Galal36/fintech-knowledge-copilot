# API Guide

## Health

### `GET /health`

Returns:

```json
{
  "status": "ok"
}
```

## Ingestion

### `POST /api/ingest/files`

Multipart upload for `.pdf`, `.txt`, `.md` files.

Form field:

- `files`: one or more files

### `POST /api/ingest/source`

Request:

```json
{
  "title": "Slack Pricing Sync",
  "content": "Pricing team approved a bundle test for merchants.",
  "source_name": "slack_simulation",
  "metadata": {
    "channel": "pricing",
    "kind": "simulated_external"
  }
}
```

## Documents

### `GET /api/docs`

Returns all ingested documents with summaries and chunk counts.

### `GET /api/docs/{id}`

Returns one document plus its processed chunks.

## AI Query

### `POST /api/ai/query`

Request:

```json
{
  "question": "What decisions were made about pricing?"
}
```

Response:

```json
{
  "answer": "Grounded answer here",
  "sources": [
    {
      "document_id": "doc-id",
      "document_title": "Pricing Notes",
      "chunk_id": "chunk-id",
      "chunk_index": 0,
      "snippet": "Relevant snippet...",
      "score": 0.91
    }
  ],
  "confidence": 0.84,
  "reasoning": "Confidence is heuristic and based on semantic match strength."
}
```

Streaming mode:

- `POST /api/ai/query?stream=true`
- returns newline-delimited JSON events with token chunks followed by a final payload

## Insights

### `GET /api/ai/insights`

Returns generated insight cards based on stored chunks.
