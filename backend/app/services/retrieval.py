from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.entities import DocumentChunk
from app.models.schemas import QueryResponse, SourceCitation
from app.services.chroma_store import ChromaStore
from app.services.llm import GeminiService

logger = logging.getLogger(__name__)


class RetrievalService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.llm = GeminiService()
        self.chroma = ChromaStore()

    def answer_question(self, question: str) -> QueryResponse:
        query_embedding = self.llm.embed_texts([question])[0]
        raw = self.chroma.query(embedding=query_embedding, top_k=self.settings.max_query_chunks)

        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]
        if not metadatas:
            return QueryResponse(
                answer="No relevant information was found in the current knowledge base.",
                sources=[],
                confidence=0.0,
                reasoning="The retrieval layer returned no matching chunks.",
            )

        sources: list[SourceCitation] = []
        context_blocks: list[str] = []

        for metadata, distance in zip(metadatas, distances):
            chunk = self.db.scalars(
                select(DocumentChunk).where(DocumentChunk.chroma_id == metadata["chunk_id"])
            ).first()
            if chunk is None:
                continue
            score = max(0.0, 1 - float(distance))
            snippet = chunk.text[:280]
            context_blocks.append(
                f"[{metadata['document_title']} - chunk {chunk.chunk_index}] {chunk.text}"
            )
            sources.append(
                SourceCitation(
                    document_id=metadata["document_id"],
                    document_title=metadata["document_title"],
                    chunk_id=chunk.id,
                    chunk_index=chunk.chunk_index,
                    snippet=snippet,
                    score=round(score, 3),
                )
            )

        if not context_blocks:
            return QueryResponse(
                answer="Relevant vectors were found, but source chunks could not be resolved.",
                sources=[],
                confidence=0.1,
                reasoning="Chroma returned metadata for chunks that were missing in PostgreSQL.",
            )

        answer = self.llm.answer_question(question=question, context_blocks=context_blocks)
        confidence = round(min(0.98, sum(source.score for source in sources) / max(len(sources), 1)), 2)
        reasoning = "Confidence is heuristic and based on semantic match strength across retrieved chunks."
        return QueryResponse(answer=answer, sources=sources, confidence=confidence, reasoning=reasoning)

    def stream_answer(self, question: str, sources: list[SourceCitation]):
        context_blocks = [
            f"[{source.document_title} - chunk {source.chunk_index}] {source.snippet}"
            for source in sources
        ]
        return self.llm.stream_answer(question=question, context_blocks=context_blocks)
