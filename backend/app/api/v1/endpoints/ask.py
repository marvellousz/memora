from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import logging
import time  # Add timing import

from ....models import QuestionRequest, QuestionResponse
from ....core.db import db_manager
from ....core.embedding import embedding_manager
from ....core.faiss_utils import faiss_manager
from ....core.llm_utils import llm_manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/ask/", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Answer a question using semantic search and local LLM
    """
    start_time = time.time()
    try:
        # Validate question
        if not request.question or len(request.question.strip()) < 3:
            raise HTTPException(status_code=400, detail="Question must be at least 3 characters long")
        
        # Check if we have any embeddings
        faiss_stats = faiss_manager.get_stats()
        if faiss_stats["total_vectors"] == 0:
            raise HTTPException(
                status_code=400, 
                detail="No embeddings found. Please upload and embed some documents first."
            )
        
        # Generate embedding for the question
        embed_start = time.time()
        logger.info(f"Processing question: {request.question}")
        question_embedding = embedding_manager.embed_text(request.question)
        embed_time = time.time() - embed_start
        
        # Search for similar chunks using FAISS (limit to reasonable number for speed)
        search_start = time.time()
        max_search_k = min(request.top_k, 10)  # Cap at 10 for performance
        search_results = faiss_manager.search(question_embedding, top_k=max_search_k)
        search_time = time.time() - search_start
        
        if not search_results:
            return QuestionResponse(
                answer="I couldn't find any relevant information to answer your question. Please try rephrasing or upload more relevant documents.",
                retrieved_chunks=[],
                confidence=0.0
            )
        
        # Retrieve full chunk information from database
        db_start = time.time()
        retrieved_chunks = []
        for chunk_id, similarity_score in search_results:
            chunk = await db_manager.get_chunk_by_id(chunk_id)
            if chunk:
                retrieved_chunks.append({
                    "chunk_id": chunk_id,
                    "content": chunk["content"],
                    "filename": chunk.get("filename", "Unknown"),
                    "chunk_index": chunk.get("chunk_index", 0),
                    "similarity_score": similarity_score,
                    "timestamp": chunk.get("timestamp")
                })
        db_time = time.time() - db_start
        
        if not retrieved_chunks:
            return QuestionResponse(
                answer="I found some potentially relevant chunks, but couldn't retrieve their content. Please try again.",
                retrieved_chunks=[],
                confidence=0.0
            )
        
        # Calculate confidence based on similarity scores
        avg_similarity = sum(chunk["similarity_score"] for chunk in retrieved_chunks) / len(retrieved_chunks)
        confidence = min(avg_similarity * 100, 100.0)  # Convert to percentage, cap at 100%
        
        # Check if LLM is available
        if not llm_manager.is_model_available():
            # Return search results without LLM processing
            logger.warning("LLM model not available, returning search results only")
            answer = f"Based on the retrieved context:\n\n"
            for i, chunk in enumerate(retrieved_chunks[:3], 1):
                answer += f"{i}. From {chunk['filename']}:\n{chunk['content'][:300]}...\n\n"
            
            total_time = time.time() - start_time
            logger.info(f"Query completed in {total_time:.2f}s (embed: {embed_time:.2f}s, search: {search_time:.2f}s, db: {db_time:.2f}s)")
            
            return QuestionResponse(
                answer=answer,
                retrieved_chunks=retrieved_chunks,
                confidence=confidence
            )
        
        # Generate answer using LLM (with timeout protection)
        llm_start = time.time()
        try:
            logger.info("Generating answer using LLM")
            # Only use top 3 chunks for LLM to speed up processing
            top_chunks = retrieved_chunks[:3]
            answer = llm_manager.generate_answer(request.question, top_chunks, max_tokens=256)  # Reduced tokens for speed
        except Exception as e:
            logger.error(f"Error generating LLM answer: {e}")
            # Fallback to simple context-based response
            answer = f"I found relevant information but encountered an error generating a response. Here's what I found:\n\n"
            for i, chunk in enumerate(retrieved_chunks[:2], 1):
                answer += f"{i}. From {chunk['filename']}:\n{chunk['content'][:200]}...\n\n"
        
        llm_time = time.time() - llm_start
        total_time = time.time() - start_time
        
        logger.info(f"Query completed in {total_time:.2f}s (embed: {embed_time:.2f}s, search: {search_time:.2f}s, db: {db_time:.2f}s, llm: {llm_time:.2f}s)")
        logger.info(f"Successfully answered question with {len(retrieved_chunks)} retrieved chunks")
        
        return QuestionResponse(
            answer=answer,
            retrieved_chunks=retrieved_chunks,
            confidence=confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Error in ask_question after {total_time:.2f}s: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/search/{query}")
async def semantic_search(query: str, top_k: int = 5):
    """
    Perform semantic search without LLM processing (for debugging/testing)
    """
    try:
        if len(query.strip()) < 3:
            raise HTTPException(status_code=400, detail="Query must be at least 3 characters long")
        
        # Check if we have embeddings
        faiss_stats = faiss_manager.get_stats()
        if faiss_stats["total_vectors"] == 0:
            raise HTTPException(status_code=400, detail="No embeddings found")
        
        # Generate embedding for query
        query_embedding = embedding_manager.embed_text(query)
        
        # Search
        search_results = faiss_manager.search(query_embedding, top_k=top_k)
        
        # Get chunk details
        chunks = []
        for chunk_id, similarity_score in search_results:
            chunk = await db_manager.get_chunk_by_id(chunk_id)
            if chunk:
                chunks.append({
                    "chunk_id": chunk_id,
                    "content": chunk["content"][:500] + "..." if len(chunk["content"]) > 500 else chunk["content"],
                    "filename": chunk.get("filename", "Unknown"),
                    "similarity_score": similarity_score
                })
        
        return {
            "query": query,
            "results": chunks,
            "total_results": len(chunks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in semantic_search: {e}")
        raise HTTPException(status_code=500, detail=f"Error performing search: {str(e)}")

@router.get("/system/status/")
async def get_system_status():
    """
    Get the status of all system components
    """
    try:
        # Database status
        all_chunks = await db_manager.get_all_chunks()
        total_docs = len(set(chunk["document_id"] for chunk in all_chunks))
        
        # Embedding status
        chunks_with_embeddings = sum(1 for chunk in all_chunks if chunk.get("embedding"))
        
        # FAISS status
        faiss_stats = faiss_manager.get_stats()
        
        # LLM status
        llm_info = llm_manager.get_model_info()
        
        return {
            "database": {
                "total_documents": total_docs,
                "total_chunks": len(all_chunks),
                "chunks_with_embeddings": chunks_with_embeddings
            },
            "embeddings": {
                "model_loaded": embedding_manager.model is not None,
                "model_name": embedding_manager.model_name,
                "dimension": embedding_manager.embedding_dimension
            },
            "faiss_index": faiss_stats,
            "llm": llm_info,
            "system_ready": (
                chunks_with_embeddings > 0 and 
                faiss_stats["total_vectors"] > 0 and 
                llm_info["is_available"]
            )
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving system status: {str(e)}")
