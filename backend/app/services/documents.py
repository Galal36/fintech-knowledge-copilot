from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import Document
from app.models.schemas import ChunkRead, DocumentDetailRead, DocumentRead


class DocumentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_documents(self) -> list[DocumentRead]:
        stmt = select(Document).options(selectinload(Document.chunks)).order_by(Document.created_at.desc())
        documents = self.db.scalars(stmt).all()
        return [self._to_document_read(document) for document in documents]

    def get_document(self, document_id: str) -> DocumentDetailRead | None:
        stmt = (
            select(Document)
            .where(Document.id == document_id)
            .options(selectinload(Document.chunks))
        )
        document = self.db.scalars(stmt).first()
        if document is None:
            return None
        return self._to_document_detail(document)

    @staticmethod
    def _to_document_read(document: Document) -> DocumentRead:
        return DocumentRead(
            id=document.id,
            title=document.title,
            source_type=document.source_type,
            file_name=document.file_name,
            mime_type=document.mime_type,
            external_source_name=document.external_source_name,
            status=document.status,
            summary=document.summary,
            metadata=document.metadata_json,
            created_at=document.created_at,
            chunk_count=len(document.chunks),
        )

    def _to_document_detail(self, document: Document) -> DocumentDetailRead:
        base = self._to_document_read(document)
        chunks = [
            ChunkRead(
                id=chunk.id,
                chunk_index=chunk.chunk_index,
                text=chunk.text,
                token_count=chunk.token_count,
                metadata=chunk.metadata_json,
            )
            for chunk in document.chunks
        ]
        return DocumentDetailRead(**base.model_dump(), chunks=chunks)
