from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentUpload(BaseModel):
    content: str
    filename: str
    content_type: str = "text/plain"

class DocumentChunk(BaseModel):
    id: Optional[str] = None
    document_id: str
    chunk_index: int
    content: str
    embedding: Optional[List[float]] = None
    filename: str
    timestamp: datetime
    metadata: Optional[dict] = None

class QuestionRequest(BaseModel):
    question: str
    top_k: Optional[int] = 5

class QuestionResponse(BaseModel):
    answer: str
    retrieved_chunks: List[dict]
    confidence: Optional[float] = None

class EmbedRequest(BaseModel):
    document_id: str
    force_reembed: Optional[bool] = False

class EmbedResponse(BaseModel):
    success: bool
    message: str
    chunks_processed: int
