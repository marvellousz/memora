from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union
import logging

logger = logging.getLogger(__name__)

class EmbeddingManager:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.embedding_dimension = 384  # Dimension for all-MiniLM-L6-v2
    
    def load_model(self):
        """Load the sentence transformer model"""
        if self.model is None:
            try:
                logger.info(f"Loading embedding model: {self.model_name}")
                self.model = SentenceTransformer(self.model_name)
                logger.info("Embedding model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise
    
    def embed_text(self, text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """Generate embeddings for text or list of texts"""
        if self.model is None:
            self.load_model()
        
        try:
            if isinstance(text, str):
                embedding = self.model.encode(text, convert_to_tensor=False)
                return embedding.tolist()
            else:
                embeddings = self.model.encode(text, convert_to_tensor=False)
                return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of text chunks"""
        if not chunks:
            return []
        
        try:
            embeddings = self.embed_text(chunks)
            return embeddings
        except Exception as e:
            logger.error(f"Error embedding chunks: {e}")
            raise
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings"""
        return self.embedding_dimension
    
    def get_model_info(self) -> dict:
        """Get information about the embedding model"""
        return {
            "model_name": self.model_name,
            "model_loaded": self.model is not None,
            "dimension": self.embedding_dimension,
            "model_type": "sentence-transformers"
        }

# Global embedding manager instance
embedding_manager = EmbeddingManager()
