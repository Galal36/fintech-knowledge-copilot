from __future__ import annotations

import hashlib
import logging
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.entities import Document, DocumentChunk
from app.models.schemas import DocumentRead, SourceIngestRequest
from app.services.chroma_store import ChromaStore
from app.services.documents import DocumentService
from app.services.extraction import SUPPORTED_TEXT_TYPES, extract_text_from_file, normalize_text
from app.services.llm import GeminiService

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()
        self.llm = GeminiService()
        self.chroma = ChromaStore()
        self.documents = DocumentService(db)

    def ingest_file(self, *, filename: str, content_type: str | None, content_bytes: bytes) -> DocumentRead:
        suffix = Path(filename).suffix.lower()
        if suffix not in SUPPORTED_TEXT_TYPES:
            raise ValueError(f"Unsupported file type: {suffix or 'unknown'}")

        text = extract_text_from_file(filename, content_bytes)
        metadata = {"source": "file", "extension": suffix}
        return self._ingest_document(
            title=Path(filename).stem,
            text=text,
            source_type="file",
            file_name=filename,
            mime_type=content_type or SUPPORTED_TEXT_TYPES[suffix],
            external_source_name=None,
            metadata=metadata,
            raw_bytes=content_bytes,
        )

    def ingest_source(self, payload: SourceIngestRequest) -> DocumentRead:
        return self._ingest_document(
            title=payload.title,
            text=normalize_text(payload.content),
            source_type="external",
            file_name=None,
            mime_type="application/json",
            external_source_name=payload.source_name,
            metadata=payload.metadata,
            raw_bytes=payload.content.encode("utf-8"),
        )

    def _ingest_document(
        self,
        *,
        title: str,
        text: str,
        source_type: str,
        file_name: str | None,
        mime_type: str | None,
        external_source_name: str | None,
        metadata: dict,
        raw_bytes: bytes,
    ) -> DocumentRead:
        content_hash = hashlib.sha256(raw_bytes).hexdigest()
        existing = self.db.scalars(
            select(Document)
            .where(Document.content_hash == content_hash)
            .options(selectinload(Document.chunks))
        ).first()
        if existing is not None:
            logger.info("Skipping duplicate document %s", existing.id)
            self._reindex_existing_document(existing)
            return self.documents._to_document_read(existing)

        summary = self.llm.safe_summary(text)
        document = Document(
            title=title,
            source_type=source_type,
            file_name=file_name,
            mime_type=mime_type,
            external_source_name=external_source_name,
            status="processing",
            content_hash=content_hash,
            summary=summary,
            metadata_json=metadata,
        )
        self.db.add(document)
        self.db.flush()

        chunks = self._chunk_text(text)
        embeddings = self.llm.embed_texts([chunk["text"] for chunk in chunks])

        chroma_ids: list[str] = []
        chroma_metadatas: list[dict] = []
        db_chunks: list[DocumentChunk] = []

        for index, chunk in enumerate(chunks):
            chroma_id = f"{document.id}:{index}:{uuid.uuid4().hex[:8]}"
            chroma_ids.append(chroma_id)
            chroma_metadatas.append(
                {
                    "document_id": document.id,
                    "document_title": document.title,
                    "chunk_id": chroma_id,
                    "chunk_index": index,
                }
            )
            db_chunks.append(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=index,
                    text=chunk["text"],
                    token_count=chunk["token_count"],
                    metadata_json={"keywords": chunk["keywords"]},
                    chroma_id=chroma_id,
                )
            )

        self.chroma.add_chunks(
            ids=chroma_ids,
            texts=[chunk["text"] for chunk in chunks],
            embeddings=embeddings,
            metadatas=chroma_metadatas,
        )

        for item in db_chunks:
            self.db.add(item)

        document.status = "ready"
        self.db.commit()
        self.db.refresh(document)
        return self.documents._to_document_read(document)

    def _reindex_existing_document(self, document: Document) -> None:
        if not document.chunks:
            return

        embeddings = self.llm.embed_texts([chunk.text for chunk in document.chunks])
        self.chroma.add_chunks(
            ids=[chunk.chroma_id for chunk in document.chunks],
            texts=[chunk.text for chunk in document.chunks],
            embeddings=embeddings,
            metadatas=[
                {
                    "document_id": document.id,
                    "document_title": document.title,
                    "chunk_id": chunk.chroma_id,
                    "chunk_index": chunk.chunk_index,
                }
                for chunk in document.chunks
            ],
        )

    def _chunk_text(self, text: str) -> list[dict]:
        if not text:
            return [{"text": "", "token_count": 0, "keywords": []}]

        chunk_size = self.settings.chunk_size
        overlap = self.settings.chunk_overlap
        chunks: list[dict] = []
        start = 0

        while start < len(text):
            end = min(len(text), start + chunk_size)
            chunk_text = text[start:end].strip()
            if chunk_text:
                words = chunk_text.split()
                keywords = [word.strip(".,:;!?").lower() for word in words[:5]]
                chunks.append(
                    {
                        "text": chunk_text,
                        "token_count": max(1, len(words)),
                        "keywords": [word for word in keywords if word],
                    }
                )
            if end >= len(text):
                break
            start = max(end - overlap, start + 1)

        return chunks or [{"text": text[:chunk_size], "token_count": len(text.split()), "keywords": []}]
