from __future__ import annotations

from chromadb import PersistentClient
from chromadb.errors import InvalidArgumentError

from app.core.config import get_settings


class ChromaStore:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = PersistentClient(path=self.settings.chroma_persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def _reset_collection(self):
        self.client.delete_collection(name=self.settings.chroma_collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        return self.collection

    def add_chunks(
        self,
        *,
        ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
        try:
            self.collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
        except InvalidArgumentError as exc:
            # Local dev can switch between fallback and Gemini embeddings, which changes dimensionality.
            # Reset the collection so the current embedding provider can repopulate it cleanly.
            if "dimension" not in str(exc).lower():
                raise
            self._reset_collection()
            self.collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)

    def query(self, *, embedding: list[float], top_k: int) -> dict:
        try:
            return self.collection.query(
                query_embeddings=[embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
