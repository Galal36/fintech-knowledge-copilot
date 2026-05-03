from __future__ import annotations

import json
import logging
from hashlib import sha256
from collections.abc import Iterator

from google import genai

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = genai.Client(api_key=self.settings.gemini_api_key) if self.settings.gemini_api_key else None

    def _ensure_client(self) -> genai.Client:
        if self.client is None:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        return self.client

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.client:
            return [self._fallback_embedding(text) for text in texts]

        try:
            client = self._ensure_client()
            embeddings: list[list[float]] = []
            for text in texts:
                response = client.models.embed_content(
                    model=self.settings.gemini_embedding_model,
                    contents=text,
                )
                vector = response.embeddings[0].values
                embeddings.append(list(vector))
            return embeddings
        except Exception:
            logger.exception("Gemini embeddings failed; falling back to local deterministic vectors")
            return [self._fallback_embedding(text) for text in texts]

    def answer_question(self, *, question: str, context_blocks: list[str]) -> str:
        if not self.client:
            return self._fallback_answer(question, context_blocks)

        prompt = (
            "You answer questions using only the provided context.\n"
            "If the context is insufficient, say so clearly.\n"
            "Reference evidence naturally and avoid unsupported claims.\n\n"
            f"Question:\n{question}\n\n"
            "Context:\n"
            + "\n\n".join(context_blocks)
        )
        try:
            client = self._ensure_client()
            response = client.models.generate_content(
                model=self.settings.gemini_generation_model,
                contents=prompt,
            )
            return response.text or "I could not generate an answer."
        except Exception:
            logger.exception("Gemini generation failed; falling back to local answer synthesis")
            return self._fallback_answer(question, context_blocks)

    def stream_answer(self, *, question: str, context_blocks: list[str]) -> Iterator[str]:
        if not self.client:
            for token in self._fallback_answer(question, context_blocks).split():
                yield token + " "
            return

        prompt = (
            "You answer questions using only the provided context.\n"
            "If the context is insufficient, say so clearly.\n"
            "Be concise and grounded.\n\n"
            f"Question:\n{question}\n\n"
            "Context:\n"
            + "\n\n".join(context_blocks)
        )
        try:
            client = self._ensure_client()
            response = client.models.generate_content_stream(
                model=self.settings.gemini_generation_model,
                contents=prompt,
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception:
            logger.exception("Gemini streaming failed; falling back to local answer synthesis")
            for token in self._fallback_answer(question, context_blocks).split():
                yield token + " "

    def safe_summary(self, text: str) -> str:
        shortened = text[:4000]
        if not self.client:
            words = shortened.split()
            return " ".join(words[:40]) if words else "Empty document."
        try:
            prompt = f"Summarize this document in one sentence:\n\n{shortened}"
            response = self.client.models.generate_content(
                model=self.settings.gemini_generation_model,
                contents=prompt,
            )
            return response.text or "Summary unavailable."
        except Exception:
            logger.exception("Failed to generate summary")
            words = shortened.split()
            return " ".join(words[:40]) if words else "Empty document."

    def generate_json(self, prompt: str) -> list[dict]:
        if not self.client:
            return [
                {
                    "type": "summary",
                    "title": "AI insights unavailable",
                    "description": "Set GEMINI_API_KEY to enable generated insight cards.",
                    "confidence": 0.35,
                }
            ]

        response = self.client.models.generate_content(
            model=self.settings.gemini_generation_model,
            contents=prompt,
        )
        raw_text = response.text or "[]"
        cleaned = raw_text.replace("```json", "").replace("```", "").strip()
        try:
            payload = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning("Insight JSON parsing failed; returning fallback")
            return [
                {
                    "type": "summary",
                    "title": "Generated overview",
                    "description": cleaned[:400],
                    "confidence": 0.5,
                }
            ]
        return payload if isinstance(payload, list) else [payload]

    @staticmethod
    def _fallback_embedding(text: str, dimensions: int = 128) -> list[float]:
        vector = [0.0] * dimensions
        words = text.lower().split()
        if not words:
            return vector

        for word in words:
            digest = sha256(word.encode("utf-8")).digest()
            for index in range(0, min(len(digest), dimensions)):
                vector[index] += digest[index] / 255.0

        length = float(len(words))
        return [value / length for value in vector]

    @staticmethod
    def _fallback_answer(question: str, context_blocks: list[str]) -> str:
        if not context_blocks:
            return "I could not find grounded context to answer this question."
        joined = " ".join(context_blocks)
        excerpt = joined[:900]
        return (
            f"Fallback answer for: {question}\n\n"
            f"Relevant context summary: {excerpt}\n\n"
            "Gemini output is unavailable, so this answer is a grounded extractive summary."
        )
