# Memora

A local, privacy-first knowledge base with semantic search and question answering using completely free and open-source AI tools.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Memora solves the problem of building a personal knowledge base with AI-powered search and question answering capabilities, all running locally on your machine. No cloud services, no API keys, no data leaving your computer.

**Who it's for:** Researchers, students, professionals, and anyone who needs to organize, search, and query their documents with AI assistance while maintaining complete privacy.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.12
- **Database**: MongoDB
- **AI/ML**: sentence-transformers, FAISS, llama-cpp-python
- **LLM**: Mistral 7B (GGUF format)
- **File Processing**: PyMuPDF
- **Deployment**: Docker, Docker Compose

## Features

- **Document Upload**: Support for PDFs and text files
- **Semantic Search**: Powered by sentence-transformers for intelligent document retrieval
- **AI Question Answering**: Local Mistral 7B model for natural language responses
- **Privacy First**: Everything runs locally - your data never leaves your machine
- **Modern UI**: Clean interface with dark/light mode support
- **Vector Search**: FAISS for lightning-fast similarity search
- **No External APIs**: Completely free and open-source tools

## Installation

### Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB 5.0+
- 8GB+ RAM (recommended)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/marvellousz/memora.git
   cd memora
   ```

2. **Run automated setup**
   ```bash
   # Linux/macOS
   ./setup.sh
   
   # Windows
   setup.bat
   ```

3. **Manual setup (alternative)**
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
   cat > backend/.env << 'EOF'
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=memora_kb
   LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   LOG_LEVEL=INFO
   FAISS_INDEX_PATH=faiss_index.pkl
   EOF
   
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
   ```

4. **Download LLM model (optional)**
   ```bash
   cd backend/models
   curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf \
     "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
   ```

## Usage

### Starting the Application

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

### Using Memora

1. **Upload Documents**: Drag & drop PDFs or enter text manually
2. **Generate Embeddings**: Click "Generate All Embeddings" in System Status
3. **Ask Questions**: Use the "Ask Questions" tab for AI-powered answers
4. **Manage Documents**: View and delete documents in "View Documents"

### Access Points

- **Main App**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Manual Deployment

1. **Build the application**
   ```bash
   # Backend
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   
   # Frontend
   cd frontend
   npm run build
   npm start
   ```

### Environment Variables

**Backend (.env)**:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=memora_kb
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2
LOG_LEVEL=INFO
FAISS_INDEX_PATH=faiss_index.pkl
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Email**: pranavmurali024@gmail.com
- **GitHub**: [https://github.com/marvellousz/memora](https://github.com/marvellousz/memora)

---

Built for local, private AI knowledge management