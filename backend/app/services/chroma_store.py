from __future__ import annotations

from chromadb import PersistentClient

from app.core.config import get_settings


class ChromaStore:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = PersistentClient(path=settings.chroma_persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        *,
        ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
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
