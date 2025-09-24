# memora

A local, privacy-first knowledge base with semantic search and question answering using completely free and open-source AI tools.

## Features

- Document Upload: PDFs and text notes
- Semantic Search: Powered by sentence-transformers
- Local LLM: Mistral 7B for question answering
- Privacy First: Everything runs locally
- Modern UI: Next.js with dark/light mode

## Tech Stack

- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: FastAPI + Python
- Embeddings: sentence-transformers (all-MiniLM-L6-v2)
- Vector Search: FAISS
- LLM: Local Mistral 7B (GGUF)
- Database: MongoDB

## Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB 5.0+
- 8GB+ RAM (recommended)

## Quick Setup

### Option 1: Automated Setup

```bash
git clone https://github.com/marvellousz/memora
cd memora

# Run setup script
./setup.sh        # Linux/macOS
setup.bat         # Windows
```

### Option 2: Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# Environment files
# Backend .env
cat > backend/.env << 'EOF'
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=memora_kb
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2
LOG_LEVEL=INFO
FAISS_INDEX_PATH=faiss_index.pkl
EOF

# Frontend .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

### Option 3: Docker

```bash
docker-compose up -d
```

## Running the Application

### Method 1: Start Scripts

```bash
./start_app.sh       # Linux/macOS
start_app.bat        # Windows
```

### Method 2: Manual (separate terminals)

```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Access

- App: http://localhost:3000
- API Docs: http://localhost:8000/docs

## Usage

1. Upload: Drag & drop PDFs in "Upload Documents"
2. Generate: Click "Generate All Embeddings" in "System Status"
3. Search: Ask questions in "Ask Questions" tab
4. Manage: View/delete documents in "View Documents"

## Optional: Download LLM Model

For question answering functionality:

```bash
cd backend/models
curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf \
  "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
```

## Troubleshooting

**MongoDB not running:**
```bash
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb/brew/mongodb-community
# Windows: Check Services panel
```

**Port conflicts:**
```bash
# Check ports: lsof -i :3000 (macOS/Linux) or netstat -ano | findstr :3000 (Windows)
```

## License

MIT License