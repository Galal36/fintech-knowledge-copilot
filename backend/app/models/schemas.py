from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SourceIngestRequest(BaseModel):
    title: str
    content: str = Field(min_length=1)
    source_name: str = "simulated_source"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChunkRead(BaseModel):
    id: str
    chunk_index: int
    text: str
    token_count: int
    metadata: dict[str, Any]


class DocumentRead(BaseModel):
    id: str
    title: str
    source_type: str
    file_name: str | None
    mime_type: str | None
    external_source_name: str | None
    status: str
    summary: str | None
    metadata: dict[str, Any]
    created_at: datetime
    chunk_count: int = 0


class DocumentDetailRead(DocumentRead):
    chunks: list[ChunkRead]


class QueryRequest(BaseModel):
    question: str = Field(min_length=3)


class SourceCitation(BaseModel):
    document_id: str
    document_title: str
    chunk_id: str
    chunk_index: int
    snippet: str
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceCitation]
    confidence: float
    reasoning: str | None = None


class InsightRead(BaseModel):
    id: str
    type: str
    title: str
    description: str
    confidence: float
    supporting_references: list[dict[str, Any]]
    created_at: datetime
