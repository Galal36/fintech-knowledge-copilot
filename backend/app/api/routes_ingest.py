from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.schemas import DocumentRead, SourceIngestRequest
from app.services.ingestion import IngestionService

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


@router.post("/files", response_model=list[DocumentRead])
async def ingest_files(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> list[DocumentRead]:
    service = IngestionService(db)
    documents: list[DocumentRead] = []

    for upload in files:
        content = await upload.read()
        try:
            documents.append(
                service.ingest_file(
                    filename=upload.filename or "uploaded-file",
                    content_type=upload.content_type,
                    content_bytes=content,
                )
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return documents


@router.post("/source", response_model=DocumentRead)
def ingest_source(
    payload: SourceIngestRequest,
    db: Session = Depends(get_db),
) -> DocumentRead:
    try:
        return IngestionService(db).ingest_source(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
