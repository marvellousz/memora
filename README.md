# memora

A local, privacy-first knowledge base with semantic search and question answering using **completely free and open-source AI tools**. No paid APIs required!

## Features

- **Document Upload**: PDFs and text notes
- **Semantic Search**: Powered by sentence-transformers
- **Local LLM**: Mistral 7B for question answering
- **Privacy First**: Everything runs locally
- **Modern UI**: Next.js with dark/light mode

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Vector Search**: FAISS
- **LLM**: Local Mistral 7B (GGUF)
- **Database**: MongoDB

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB 5.0+
- 8GB+ RAM (recommended)

### Installation

1. **Clone & Setup**
   ```bash
   git clone <repository-url>
   cd memora
   
   # Automated setup
   ./setup.sh        # Linux/macOS
   setup.bat         # Windows
   ```

2. **Download LLM Model**
   ```bash
   cd backend/models
   curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf \
     "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
   ```

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# Environment
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### Run Application

```bash
# Method 1: Start scripts
./start_app.sh       # Linux/macOS
start_app.bat        # Windows

# Method 2: Manual (separate terminals)
# Terminal 1 - Backend
cd backend && source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Docker (Alternative)

```bash
docker-compose up -d
```

## Access

- **App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

## Usage

1. **Upload**: Drag & drop PDFs in "Upload Documents"
2. **Generate**: Click "Generate All Embeddings" in "System Status"
3. **Search**: Ask questions in "Ask Questions" tab
4. **Manage**: View/delete documents in "View Documents"

## Configuration

**Backend (`.env`)**:
```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=memora_kb
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
```

**Frontend (`.env.local`)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

**MongoDB not running**:
```bash
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb/brew/mongodb-community
# Windows: Check Services panel
```

**Port conflicts**:
```bash
# Check ports: lsof -i :3000 (macOS/Linux) or netstat -ano | findstr :3000 (Windows)
```

**Build errors**: Install Visual Studio Build Tools (Windows) or `xcode-select --install` (macOS)

## API Endpoints

- `POST /api/v1/upload/` - Upload documents
- `GET /api/v1/documents/` - List documents
- `POST /api/v1/ask/` - Ask questions
- `GET /api/v1/status/` - System status

## License

MIT License - see LICENSE file for details.

---

**Built for local, private AI knowledge management**
