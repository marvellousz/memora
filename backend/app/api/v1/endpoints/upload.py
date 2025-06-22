from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import aiofiles
import uuid
from datetime import datetime
import logging

from ....models import DocumentUpload
from ....core.db import db_manager
from ....core.pdf_utils import pdf_processor
from ....core.embedding import embedding_manager
from ....core.faiss_utils import faiss_manager
from ....core.llm_utils import llm_manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload/")
async def upload_document(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    filename: Optional[str] = Form(None)
):
    """
    Upload a PDF file or text content for processing
    """
    try:
        # Validate input
        if not file and not text_content:
            raise HTTPException(status_code=400, detail="Either file or text_content must be provided")
        
        # Process file upload
        if file:
            # Validate file type
            if file.content_type not in ["application/pdf", "text/plain"]:
                raise HTTPException(status_code=400, detail="Only PDF and text files are supported")
            
            # Read file content
            file_content = await file.read()
            file_name = file.filename
            
            # Extract text based on file type
            if file.content_type == "application/pdf":
                try:
                    text_content = pdf_processor.extract_text_from_pdf(file_content)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
            else:
                text_content = file_content.decode('utf-8')
        
        else:
            # Use provided text content
            file_name = filename or f"text_document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        # Validate extracted text
        if not text_content or len(text_content.strip()) < 10:
            raise HTTPException(status_code=400, detail="Document must contain at least 10 characters of text")
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Chunk the text
        chunks = pdf_processor.chunk_text(text_content)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No valid chunks could be extracted from the document")
        
        # Prepare document metadata
        document_data = {
            "_id": document_id,
            "filename": file_name,
            "content_type": file.content_type if file else "text/plain",
            "total_chunks": len(chunks),
            "upload_timestamp": datetime.utcnow(),
            "original_text": text_content[:1000] + "..." if len(text_content) > 1000 else text_content,  # Store preview
            "total_characters": len(text_content)
        }
        
        # Save document to database
        await db_manager.create_document(document_data)
        
        # Save chunks to database
        chunk_ids = []
        for i, chunk_content in enumerate(chunks):
            chunk_data = {
                "_id": str(uuid.uuid4()),
                "document_id": document_id,
                "chunk_index": i,
                "content": chunk_content,
                "filename": file_name,
                "timestamp": datetime.utcnow(),
                "embedding": None,  # Will be added later
                "metadata": {
                    "chunk_length": len(chunk_content),
                    "chunk_type": "text"
                }
            }
            
            chunk_id = await db_manager.create_chunk(chunk_data)
            chunk_ids.append(chunk_id)
        
        logger.info(f"Successfully uploaded document {document_id} with {len(chunks)} chunks")
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": file_name,
            "chunks_created": len(chunks),
            "chunk_ids": chunk_ids,
            "message": f"Successfully processed document with {len(chunks)} chunks"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in upload_document: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/documents/")
async def list_documents():
    """
    List all uploaded documents
    """
    try:
        documents = []
        async for doc in db_manager.db.documents.find():
            documents.append({
                "document_id": doc["_id"],
                "filename": doc["filename"],
                "upload_timestamp": doc["upload_timestamp"],
                "total_chunks": doc["total_chunks"],
                "content_type": doc["content_type"]
            })
        
        return {"documents": documents}
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """
    Get details of a specific document
    """
    try:
        document = await db_manager.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get chunks for this document
        chunks = await db_manager.get_chunks_by_document(document_id)
        
        return {
            "document": document,
            "chunks": len(chunks),
            "chunks_with_embeddings": sum(1 for chunk in chunks if chunk.get("embedding"))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and all its chunks from the knowledge base
    """
    try:
        # Check if document exists
        document = await db_manager.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get all chunks for this document
        chunks = await db_manager.get_chunks_by_document(document_id)
        chunk_ids = [chunk["_id"] for chunk in chunks]
        
        # Remove embeddings from FAISS index
        if chunk_ids:
            try:
                from ....core.faiss_utils import faiss_manager
                faiss_manager.remove_embeddings(chunk_ids)
            except Exception as e:
                logger.warning(f"Error removing embeddings from FAISS index: {e}")
        
        # Delete all chunks for this document
        await db_manager.delete_chunks_by_document(document_id)
        
        # Delete the document
        await db_manager.delete_document(document_id)
        
        logger.info(f"Successfully deleted document {document_id} with {len(chunks)} chunks")
        
        return {
            "success": True,
            "message": f"Successfully deleted document '{document['filename']}' and {len(chunks)} chunks",
            "document_id": document_id,
            "chunks_deleted": len(chunks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@router.delete("/documents/")
async def delete_all_documents():
    """
    Delete all documents and chunks from the knowledge base
    """
    try:
        # Get all documents
        all_documents = []
        async for doc in db_manager.db.documents.find():
            all_documents.append(doc)
        
        if not all_documents:
            return {
                "success": True,
                "message": "No documents to delete",
                "documents_deleted": 0,
                "chunks_deleted": 0
            }
        
        # Get all chunks
        all_chunks = await db_manager.get_all_chunks()
        
        # Clear FAISS index
        try:
            from ....core.faiss_utils import faiss_manager
            faiss_manager.clear_index()
        except Exception as e:
            logger.warning(f"Error clearing FAISS index: {e}")
        
        # Delete all chunks
        chunk_count = len(all_chunks)
        await db_manager.db.chunks.delete_many({})
        
        # Delete all documents
        doc_count = len(all_documents)
        await db_manager.db.documents.delete_many({})
        
        logger.info(f"Successfully deleted all {doc_count} documents and {chunk_count} chunks")
        
        return {
            "success": True,
            "message": f"Successfully deleted all {doc_count} documents and {chunk_count} chunks",
            "documents_deleted": doc_count,
            "chunks_deleted": chunk_count
        }
        
    except Exception as e:
        logger.error(f"Error deleting all documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting all documents: {str(e)}")

@router.get("/status/")
async def get_system_status():
    """
    Get comprehensive system status including database, embeddings, FAISS, and LLM
    """
    try:
        # Get database statistics
        total_documents = await db_manager.db.documents.count_documents({})
        total_chunks = await db_manager.db.chunks.count_documents({})
        chunks_with_embeddings = await db_manager.db.chunks.count_documents({"embedding": {"$ne": None}})
        
        # Get embedding model info
        embedding_info = embedding_manager.get_model_info()
        
        # Get FAISS index info
        faiss_info = faiss_manager.get_index_info()
        
        # Get LLM info
        llm_info = llm_manager.get_model_info()
        
        system_status = {
            "database": {
                "total_documents": total_documents,
                "total_chunks": total_chunks,
                "chunks_with_embeddings": chunks_with_embeddings
            },
            "embeddings": {
                "model_loaded": embedding_info.get("model_loaded", False),
                "model_name": embedding_info.get("model_name", "unknown"),
                "dimension": embedding_info.get("dimension", 0)
            },
            "faiss_index": {
                "total_vectors": faiss_info.get("total_vectors", 0),
                "dimension": faiss_info.get("dimension", 0),
                "index_type": faiss_info.get("index_type", "unknown")
            },
            "llm": {
                "model_path": llm_info.get("model_path", ""),
                "is_loaded": llm_info.get("is_loaded", False),
                "is_available": llm_info.get("is_available", False),
                "context_window": llm_info.get("context_window", 0),
                "library": llm_info.get("library", "none")
            },
            "system_ready": chunks_with_embeddings > 0 and embedding_info.get("model_loaded", False)
        }
        
        return system_status
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving system status: {str(e)}")
