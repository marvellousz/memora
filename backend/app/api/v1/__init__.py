from fastapi import APIRouter
from .endpoints import upload, embed, ask

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(upload.router, prefix="/api/v1", tags=["upload"])
api_router.include_router(embed.router, prefix="/api/v1", tags=["embeddings"])
api_router.include_router(ask.router, prefix="/api/v1", tags=["questions"])
