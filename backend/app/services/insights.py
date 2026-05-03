from __future__ import annotations

import json
import logging
from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.entities import DocumentChunk, Insight
from app.models.schemas import InsightRead
from app.services.llm import GeminiService

logger = logging.getLogger(__name__)


class InsightService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.llm = GeminiService()

    def get_or_generate_insights(self) -> list[InsightRead]:
        insights = self.db.scalars(select(Insight).order_by(Insight.created_at.desc())).all()
        if insights and not self._should_regenerate(insights):
            return [self._to_schema(item) for item in insights]

        return self.refresh_insights()

    def refresh_insights(self) -> list[InsightRead]:
        chunks = self.db.scalars(select(DocumentChunk).order_by(DocumentChunk.created_at.desc()).limit(20)).all()
        if not chunks:
            self.db.execute(delete(Insight))
            self.db.commit()
            return []

        generated = self._generate_from_chunks(chunks)
        self.db.execute(delete(Insight))
        for item in generated:
            self.db.add(item)
        self.db.commit()
        return [self._to_schema(item) for item in generated]

    def _should_regenerate(self, insights: list[Insight]) -> bool:
        if not insights:
            return True
        if self.llm.client is None:
            return False
        return any(item.title == "AI insights unavailable" for item in insights)

    def _generate_from_chunks(self, chunks: list[DocumentChunk]) -> list[Insight]:
        grouped_examples = defaultdict(list)
        for chunk in chunks:
            tags = chunk.metadata_json.get("keywords", [])
            key = tags[0] if tags else "general"
            if len(grouped_examples[key]) < 3:
                grouped_examples[key].append(chunk.text[:280])

        prompt = (
            "You are an analyst building proactive insights for a knowledge operations system.\n"
            "Given the following grouped evidence, return a JSON array where each item contains:\n"
            "type, title, description, confidence.\n"
            "Types should be one of recurring_issue, decision_pattern, possible_conflict, summary.\n"
            "Keep descriptions concise and grounded.\n\n"
            f"Evidence:\n{json.dumps(grouped_examples, ensure_ascii=True)}"
        )

        insights_payload = self.llm.generate_json(prompt)
        results: list[Insight] = []
        for index, item in enumerate(insights_payload[:6]):
            references = [{"sample_group": list(grouped_examples.keys())[index % len(grouped_examples)]}]
            results.append(
                Insight(
                    type=item.get("type", "summary"),
                    title=item.get("title", "Generated insight"),
                    description=item.get("description", "No description available."),
                    confidence=float(item.get("confidence", 0.6)),
                    supporting_references_json=references,
                )
            )
        return results

    @staticmethod
    def _to_schema(item: Insight) -> InsightRead:
        return InsightRead(
            id=item.id,
            type=item.type,
            title=item.title,
            description=item.description,
            confidence=item.confidence,
            supporting_references=item.supporting_references_json,
            created_at=item.created_at,
        )
