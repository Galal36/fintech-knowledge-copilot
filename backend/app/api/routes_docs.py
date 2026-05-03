from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.schemas import DocumentDetailRead, DocumentRead
from app.services.documents import DocumentService

router = APIRouter(prefix="/api/docs", tags=["documents"])


@router.get("", response_model=list[DocumentRead])
def list_documents(db: Session = Depends(get_db)) -> list[DocumentRead]:
    return DocumentService(db).list_documents()


@router.get("/{document_id}", response_model=DocumentDetailRead)
def get_document(document_id: str, db: Session = Depends(get_db)) -> DocumentDetailRead:
    document = DocumentService(db).get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document
