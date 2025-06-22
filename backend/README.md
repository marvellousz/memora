# Backend API - Personal Knowledge Base

FastAPI backend for the Personal Knowledge Base with semantic search capabilities.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- MongoDB running locally (port 27017)
- At least 4GB RAM for running local LLM

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Download LLM Model (Optional but Recommended)

For question answering, download a GGUF model:

```bash
# Create models directory
mkdir models

# Download Mistral 7B (example - choose one)
# Option 1: Mistral 7B Instruct (recommended)
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf -O models/mistral-7b-instruct-v0.1.Q4_K_M.gguf

# Option 2: Zephyr 7B Beta
wget https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf -O models/zephyr-7b-beta.Q4_K_M.gguf
```

### Running the Server

```bash
# Development mode (with auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## 📚 API Endpoints

### Document Management
- `POST /api/v1/upload/` - Upload PDF or text documents
- `GET /api/v1/documents/` - List all documents
- `GET /api/v1/documents/{id}` - Get document details

### Embeddings
- `POST /api/v1/embed/` - Generate embeddings for a document
- `POST /api/v1/embed/all/` - Generate embeddings for all documents
- `GET /api/v1/embed/status/` - Check embedding status

### Question Answering
- `POST /api/v1/ask/` - Ask questions using semantic search + LLM
- `GET /api/v1/search/{query}` - Semantic search only (no LLM)
- `GET /api/v1/system/status/` - System status

### Health Checks
- `GET /` - Basic health check
- `GET /health` - Detailed health check

## 🛠️ Configuration

### Environment Variables

Create a `.env` file (optional):

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=knowledge_base
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2
LOG_LEVEL=INFO
```

### Model Configuration

The system uses these models by default:
- **Embeddings**: `all-MiniLM-L6-v2` (384 dimensions)
- **LLM**: Any GGUF model placed in `models/` directory

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/       # API endpoints
│   ├── core/                   # Core utilities
│   ├── main.py                 # FastAPI app
│   └── models.py               # Pydantic models
├── requirements.txt
└── README.md
```

## 🔧 Usage Examples

### 1. Upload a Document

```bash
curl -X POST "http://localhost:8000/api/v1/upload/" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"
```

### 2. Generate Embeddings

```bash
curl -X POST "http://localhost:8000/api/v1/embed/" \
     -H "Content-Type: application/json" \
     -d '{"document_id": "your-document-id"}'
```

### 3. Ask a Question

```bash
curl -X POST "http://localhost:8000/api/v1/ask/" \
     -H "Content-Type: application/json" \
     -d '{"question": "What is this document about?", "top_k": 5}'
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `mongod --dbpath /your/db/path`
   - Check connection string in logs

2. **LLM Model Not Found**
   - Download a GGUF model to the `models/` directory
   - The system will work without LLM (search only)

3. **Memory Issues**
   - Reduce LLM model size (use Q4_K_M instead of larger quantizations)
   - Increase system RAM or use cloud deployment

4. **Slow Embedding Generation**
   - First run downloads the sentence-transformer model
   - Subsequent runs will be faster

### Logs

Check logs for detailed error information:
```bash
tail -f app.log
```

## 🚀 Deployment

### Docker (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Performance Tips

- Use SSD storage for FAISS index
- Consider GPU acceleration for embeddings (change to `faiss-gpu`)
- Use connection pooling for high-traffic scenarios
