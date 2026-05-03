from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.schemas import InsightRead, QueryRequest, QueryResponse, SourceCitation
from app.services.insights import InsightService
from app.services.retrieval import RetrievalService

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/query", response_model=QueryResponse)
def query_knowledge(
    payload: QueryRequest,
    stream: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> QueryResponse | StreamingResponse:
    retrieval_service = RetrievalService(db)
    try:
        result = retrieval_service.answer_question(payload.question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not stream:
        return result

    def event_stream() -> Iterator[str]:
        for token in retrieval_service.stream_answer(payload.question, result.sources):
            yield json.dumps({"type": "token", "content": token}) + "\n"
        yield (
            json.dumps(
                {
                    "type": "final",
                    "payload": {
                        "answer": result.answer,
                        "sources": [source.model_dump() for source in result.sources],
                        "confidence": result.confidence,
                        "reasoning": result.reasoning,
                    },
                }
            )
            + "\n"
        )

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


@router.get("/insights", response_model=list[InsightRead])
def get_insights(db: Session = Depends(get_db)) -> list[InsightRead]:
    insight_service = InsightService(db)
    return insight_service.get_or_generate_insights()


@router.post("/insights/refresh", response_model=list[InsightRead])
def refresh_insights(db: Session = Depends(get_db)) -> list[InsightRead]:
    insight_service = InsightService(db)
    return insight_service.refresh_insights()
