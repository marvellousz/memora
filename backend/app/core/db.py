from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, mongodb_url: str = "mongodb://localhost:27017", db_name: str = "knowledge_base"):
        self.mongodb_url = mongodb_url
        self.db_name = db_name
        self.client: AsyncIOMotorClient = None
        self.db = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_url)
            self.db = self.client[self.db_name]
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def create_document(self, document_data: Dict[str, Any]) -> str:
        """Create a new document and return its ID"""
        result = await self.db.documents.insert_one(document_data)
        return str(result.inserted_id)
    
    async def get_document(self, document_id: str) -> Dict[str, Any]:
        """Get a document by ID"""
        document = await self.db.documents.find_one({"_id": document_id})
        return document
    
    async def create_chunk(self, chunk_data: Dict[str, Any]) -> str:
        """Create a new chunk and return its ID"""
        result = await self.db.chunks.insert_one(chunk_data)
        return str(result.inserted_id)
    
    async def get_chunks_by_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Get all chunks for a document"""
        chunks = []
        async for chunk in self.db.chunks.find({"document_id": document_id}):
            chunks.append(chunk)
        return chunks
    
    async def get_chunk_by_id(self, chunk_id: str) -> Dict[str, Any]:
        """Get a chunk by ID"""
        chunk = await self.db.chunks.find_one({"_id": chunk_id})
        return chunk
    
    async def update_chunk_embedding(self, chunk_id: str, embedding: List[float]):
        """Update chunk with embedding"""
        await self.db.chunks.update_one(
            {"_id": chunk_id},
            {"$set": {"embedding": embedding}}
        )
    
    async def get_all_chunks(self) -> List[Dict[str, Any]]:
        """Get all chunks"""
        chunks = []
        async for chunk in self.db.chunks.find():
            chunks.append(chunk)
        return chunks
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document by ID"""
        result = await self.db.documents.delete_one({"_id": document_id})
        return result.deleted_count > 0
    
    async def delete_chunks_by_document(self, document_id: str) -> int:
        """Delete all chunks for a document. Returns number of deleted chunks."""
        result = await self.db.chunks.delete_many({"document_id": document_id})
        return result.deleted_count
    
    async def delete_chunk_by_id(self, chunk_id: str) -> bool:
        """Delete a chunk by ID"""
        result = await self.db.chunks.delete_one({"_id": chunk_id})
        return result.deleted_count > 0

# Global database instance
db_manager = DatabaseManager()
