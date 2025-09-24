from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn
from contextlib import asynccontextmanager

from .api.v1 import api_router
from .core.db import db_manager
from .core.embedding import embedding_manager
from .core.faiss_utils import faiss_manager
from .core.llm_utils import llm_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up Memora API...")
    
    try:
        # Connect to database
        await db_manager.connect()
        logger.info("Connected to MongoDB")
        
        # Load embedding model
        embedding_manager.load_model()
        logger.info("Loaded embedding model")
        
        # Initialize FAISS index
        logger.info("FAISS index initialized")
        
        # Check LLM model availability
        if llm_manager.is_model_available():
            logger.info("LLM model found and ready")
        else:
            logger.warning(f"LLM model not found at {llm_manager.model_path}")
            logger.warning("Please download a GGUF model (e.g., Mistral 7B) for question answering")
        
        logger.info("Startup complete!")
        
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await db_manager.disconnect()
    logger.info("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Memora API",
    description="A semantic search-powered knowledge base with local LLM integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "Memora API",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check database connection
        await db_manager.db.admin.command('ping')
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    # Check embedding model
    embedding_status = "loaded" if embedding_manager.model else "not_loaded"
    
    # Check FAISS index
    faiss_stats = faiss_manager.get_stats()
    
    # Check LLM
    llm_status = "available" if llm_manager.is_model_available() else "not_available"
    
    return {
        "database": db_status,
        "embedding_model": embedding_status,
        "faiss_vectors": faiss_stats["total_vectors"],
        "llm_model": llm_status,
        "overall_status": "healthy" if db_status == "connected" else "degraded"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
