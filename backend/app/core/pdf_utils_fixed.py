import re
from typing import List
import logging
import io

logger = logging.getLogger(__name__)

# Try pypdf first (easier to install)
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
    PDF_LIBRARY = "pypdf"
except ImportError:
    PYPDF_AVAILABLE = False
    PDF_LIBRARY = None

# Fallback to PyMuPDF if pypdf not available
if not PYPDF_AVAILABLE:
    try:
        import fitz  # PyMuPDF
        PYMUPDF_AVAILABLE = True
        PDF_LIBRARY = "pymupdf"
    except ImportError:
        PYMUPDF_AVAILABLE = False
        logger.warning("Neither pypdf nor PyMuPDF are available. PDF processing will be disabled.")
else:
    PYMUPDF_AVAILABLE = False

class PDFProcessor:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):  # Reduced for better performance
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes"""
        if not PYPDF_AVAILABLE and not PYMUPDF_AVAILABLE:
            raise ImportError("No PDF processing library is available. Please install pypdf or PyMuPDF.")
        
        try:
            if PYPDF_AVAILABLE:
                return self._extract_with_pypdf(pdf_bytes)
            elif PYMUPDF_AVAILABLE:
                return self._extract_with_pymupdf(pdf_bytes)
        except Exception as e:
            logger.error(f"Error extracting text from PDF using {PDF_LIBRARY}: {e}")
            raise
    
    def _extract_with_pypdf(self, pdf_bytes: bytes) -> str:
        """Extract text using pypdf"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                text += page_text
                text += "\n\n"  # Add page breaks
            
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text with pypdf: {e}")
            raise
    
    def _extract_with_pymupdf(self, pdf_bytes: bytes) -> str:
        """Extract text using PyMuPDF (fallback)"""
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                text += page.get_text()
                text += "\n\n"  # Add page breaks
            
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text with PyMuPDF: {e}")
            raise
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text while preserving important characters like @ for emails"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Keep important characters including @ for emails, + for phones, etc.
        # This pattern keeps: letters, numbers, spaces, common punctuation, @, +, /, \, =, etc.
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\'\"@+/\\=&%$#]', '', text)
        
        # Remove multiple consecutive punctuation
        text = re.sub(r'([.!?]){2,}', r'\1', text)
        
        return text.strip()
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        # Clean the text first
        text = self.clean_text(text)
        
        # Split by sentences first (more natural boundaries)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size, save current chunk
            if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                
                # Start new chunk with overlap from previous chunk
                if self.chunk_overlap > 0:
                    words = current_chunk.split()
                    overlap_words = words[-self.chunk_overlap//10:]  # Approximate word-based overlap
                    current_chunk = " ".join(overlap_words) + " " + sentence
                else:
                    current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Filter out very short chunks (reduced from 50 to 10 to allow shorter test content)
        chunks = [chunk for chunk in chunks if len(chunk) > 10]
        
        return chunks

# Global PDF processor instance
pdf_processor = PDFProcessor()
