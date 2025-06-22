import faiss
import numpy as np
import pickle
import os
from typing import List, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class FAISSManager:
    def __init__(self, dimension: int = 384, index_path: str = "faiss_index.pkl"):
        self.dimension = dimension
        self.index_path = index_path
        self.index = None
        self.chunk_ids = []  # Keep track of chunk IDs corresponding to vectors
        self.load_or_create_index()
    
    def load_or_create_index(self):
        """Load existing FAISS index or create a new one"""
        if os.path.exists(self.index_path):
            try:
                with open(self.index_path, 'rb') as f:
                    data = pickle.load(f)
                    self.index = data['index']
                    self.chunk_ids = data['chunk_ids']
                logger.info(f"Loaded FAISS index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.error(f"Error loading FAISS index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        # Use IndexFlatIP for cosine similarity (Inner Product)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.chunk_ids = []
        logger.info(f"Created new FAISS index with dimension {self.dimension}")
    
    def add_embeddings(self, embeddings: List[List[float]], chunk_ids: List[str]):
        """Add embeddings to the FAISS index"""
        if not embeddings or not chunk_ids:
            return
        
        if len(embeddings) != len(chunk_ids):
            raise ValueError("Number of embeddings must match number of chunk IDs")
        
        try:
            # Convert to numpy array and normalize for cosine similarity
            embeddings_array = np.array(embeddings, dtype=np.float32)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings_array)
            
            # Add to index
            self.index.add(embeddings_array)
            self.chunk_ids.extend(chunk_ids)
            
            logger.info(f"Added {len(embeddings)} embeddings to FAISS index")
            
            # Save index
            self.save_index()
            
        except Exception as e:
            logger.error(f"Error adding embeddings to FAISS index: {e}")
            raise
    
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Tuple[str, float]]:
        """Search for similar embeddings"""
        if self.index.ntotal == 0:
            return []
        
        try:
            # Convert query to numpy array and normalize
            query_array = np.array([query_embedding], dtype=np.float32)
            faiss.normalize_L2(query_array)
            
            # Search
            scores, indices = self.index.search(query_array, min(top_k, self.index.ntotal))
            
            # Return chunk IDs and scores
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx != -1 and idx < len(self.chunk_ids):  # Valid index
                    results.append((self.chunk_ids[idx], float(score)))
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching FAISS index: {e}")
            raise
    
    def save_index(self):
        """Save the FAISS index to disk"""
        try:
            data = {
                'index': self.index,
                'chunk_ids': self.chunk_ids
            }
            with open(self.index_path, 'wb') as f:
                pickle.dump(data, f)
            logger.info(f"Saved FAISS index to {self.index_path}")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {e}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the FAISS index"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "index_type": type(self.index).__name__ if self.index else None
        }
    
    def remove_embeddings(self, chunk_ids_to_remove: List[str]):
        """Remove embeddings from the FAISS index by chunk IDs"""
        if not chunk_ids_to_remove:
            return
        
        try:
            # Find indices to remove
            indices_to_remove = []
            for chunk_id in chunk_ids_to_remove:
                if chunk_id in self.chunk_ids:
                    indices_to_remove.append(self.chunk_ids.index(chunk_id))
            
            if not indices_to_remove:
                logger.warning("No matching chunk IDs found to remove")
                return
            
            # Since FAISS doesn't support direct removal, we need to rebuild the index
            # Get all current vectors
            all_vectors = []
            new_chunk_ids = []
            
            for i in range(self.index.ntotal):
                if i not in indices_to_remove:
                    # Reconstruct vector from index
                    vector = self.index.reconstruct(i)
                    all_vectors.append(vector)
                    new_chunk_ids.append(self.chunk_ids[i])
            
            # Create new index with remaining vectors
            self._create_new_index()
            if all_vectors:
                embeddings_array = np.array(all_vectors, dtype=np.float32)
                faiss.normalize_L2(embeddings_array)
                self.index.add(embeddings_array)
                self.chunk_ids = new_chunk_ids
            
            self.save_index()
            logger.info(f"Removed {len(indices_to_remove)} embeddings from FAISS index")
            
        except Exception as e:
            logger.error(f"Error removing embeddings from FAISS index: {e}")
            raise
    
    def clear_index(self):
        """Clear all embeddings from the FAISS index"""
        try:
            self._create_new_index()
            self.save_index()
            logger.info("Cleared all embeddings from FAISS index")
        except Exception as e:
            logger.error(f"Error clearing FAISS index: {e}")
            raise
    
    def get_index_info(self) -> dict:
        """Get information about the FAISS index"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "index_type": "IndexFlatIP",  # Inner Product (cosine similarity after normalization)
            "is_trained": self.index.is_trained if self.index else False,
            "chunk_ids_count": len(self.chunk_ids)
        }

# Global FAISS manager instance
faiss_manager = FAISSManager()
