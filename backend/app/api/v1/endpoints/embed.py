from fastapi import APIRouter, HTTPException
from typing import List
import logging

from ....models import EmbedRequest, EmbedResponse
from ....core.db import db_manager
from ....core.embedding import embedding_manager
from ....core.faiss_utils import faiss_manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/embed/", response_model=EmbedResponse)
async def embed_document(request: EmbedRequest):
    """
    Generate embeddings for all chunks of a document and store them
    """
    try:
        # Check if document exists
        document = await db_manager.get_document(request.document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get all chunks for the document
        chunks = await db_manager.get_chunks_by_document(request.document_id)
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No chunks found for this document")
        
        # Check if embeddings already exist and force_reembed is False
        if not request.force_reembed:
            chunks_with_embeddings = [chunk for chunk in chunks if chunk.get("embedding")]
            if chunks_with_embeddings:
                logger.info(f"Document {request.document_id} already has embeddings. Use force_reembed=true to regenerate.")
                return EmbedResponse(
                    success=True,
                    message=f"Document already has embeddings for {len(chunks_with_embeddings)} chunks. Use force_reembed=true to regenerate.",
                    chunks_processed=len(chunks_with_embeddings)
                )
        
        # Extract text content from chunks
        chunk_texts = [chunk["content"] for chunk in chunks]
        chunk_ids = [chunk["_id"] for chunk in chunks]
        
        # Generate embeddings
        logger.info(f"Generating embeddings for {len(chunk_texts)} chunks")
        embeddings = embedding_manager.embed_chunks(chunk_texts)
        
        if len(embeddings) != len(chunks):
            raise HTTPException(status_code=500, detail="Mismatch between chunks and embeddings")
        
        # Update chunks with embeddings in database
        for chunk, embedding in zip(chunks, embeddings):
            await db_manager.update_chunk_embedding(chunk["_id"], embedding)
        
        # Add embeddings to FAISS index
        faiss_manager.add_embeddings(embeddings, chunk_ids)
        
        logger.info(f"Successfully generated and stored embeddings for {len(chunks)} chunks")
        
        return EmbedResponse(
            success=True,
            message=f"Successfully generated embeddings for {len(chunks)} chunks",
            chunks_processed=len(chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in embed_document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating embeddings: {str(e)}")

@router.post("/embed/all/")
async def embed_all_documents():
    """
    Generate embeddings for all documents that don't have them yet
    """
    try:
        # Get all chunks without embeddings
        all_chunks = await db_manager.get_all_chunks()
        chunks_without_embeddings = [chunk for chunk in all_chunks if not chunk.get("embedding")]
        
        if not chunks_without_embeddings:
            return {
                "success": True,
                "message": "All chunks already have embeddings",
                "chunks_processed": 0
            }
        
        # Group chunks by document for better logging
        doc_chunks = {}
        for chunk in chunks_without_embeddings:
            doc_id = chunk["document_id"]
            if doc_id not in doc_chunks:
                doc_chunks[doc_id] = []
            doc_chunks[doc_id].append(chunk)
        
        total_processed = 0
        
        # Process each document
        for doc_id, chunks in doc_chunks.items():
            try:
                logger.info(f"Processing {len(chunks)} chunks for document {doc_id}")
                
                # Extract text content and IDs
                chunk_texts = [chunk["content"] for chunk in chunks]
                chunk_ids = [chunk["_id"] for chunk in chunks]
                
                # Generate embeddings
                embeddings = embedding_manager.embed_chunks(chunk_texts)
                
                # Update database
                for chunk, embedding in zip(chunks, embeddings):
                    await db_manager.update_chunk_embedding(chunk["_id"], embedding)
                
                # Add to FAISS index
                faiss_manager.add_embeddings(embeddings, chunk_ids)
                
                total_processed += len(chunks)
                logger.info(f"Processed {len(chunks)} chunks for document {doc_id}")
                
            except Exception as e:
                logger.error(f"Error processing document {doc_id}: {e}")
                continue
        
        return {
            "success": True,
            "message": f"Successfully processed {total_processed} chunks across {len(doc_chunks)} documents",
            "chunks_processed": total_processed,
            "documents_processed": len(doc_chunks)
        }
        
    except Exception as e:
        logger.error(f"Error in embed_all_documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing embeddings: {str(e)}")

@router.get("/embed/status/")
async def get_embedding_status():
    """
    Get embedding system status
    """
    try:
        # Get chunks statistics
        total_chunks = await db_manager.db.chunks.count_documents({})
        chunks_with_embeddings = await db_manager.db.chunks.count_documents({"embedding": {"$ne": None}})
        chunks_without_embeddings = total_chunks - chunks_with_embeddings
        
        # Get embedding model info
        embedding_info = embedding_manager.get_model_info()
        
        # Get FAISS index info
        faiss_info = faiss_manager.get_index_info()
        
        status = {
            "chunks": {
                "total": total_chunks,
                "with_embeddings": chunks_with_embeddings,
                "without_embeddings": chunks_without_embeddings,
                "completion_percentage": (chunks_with_embeddings / total_chunks * 100) if total_chunks > 0 else 0
            },
            "embedding_model": embedding_info,
            "faiss_index": faiss_info,
            "ready": chunks_with_embeddings > 0 and embedding_info.get("model_loaded", False)
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Error getting embedding status: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving embedding status: {str(e)}")
