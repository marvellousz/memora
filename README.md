# Memora - AI-Powered Personal Knowledge Base

A full-stack application for building a personal knowledge base with semantic search and question answering capabilities using **completely free and open-source AI tools**. No OpenAI or paid APIs required!

## Features

- **Document Upload**: Upload PDFs or write notes directly
- **Text Processing**: Automatic text extraction and intelligent chunking
- **Semantic Search**: Powered by sentence-transformers (all-MiniLM-L6-v2)
- **Vector Search**: FAISS for lightning-fast similarity search
- **Local LLM**: Locally hosted language model (Mistral 7B) for question answering
- **Metadata Storage**: MongoDB for document and chunk metadata
- **Modern UI**: Beautiful Next.js frontend with Tailwind CSS and dark/light mode
- **Privacy First**: Everything runs locally - your data never leaves your machine

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) with async support
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Vector Search**: FAISS (CPU optimized)
- **LLM**: Local GGUF models via ctransformers/llama-cpp-python
- **Database**: MongoDB for metadata storage
- **PDF Processing**: pypdf/PyMuPDF for text extraction
- **Deployment**: Docker support included

## Quick Start Guide

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18+)
- **Python**: 3.8+ (3.10+ recommended)
- **Node.js**: 18+ (LTS recommended)
- **MongoDB**: 5.0+ (Community Edition)
- **RAM**: 4GB minimum (8GB+ recommended for LLM)
- **Storage**: 10GB+ free space (for models and dependencies)

### Prerequisites Installation

#### 1. Install Python
**Windows:**
- Download from [python.org](https://www.python.org/downloads/)
- Check "Add Python to PATH" during installation
- Verify: `python --version`

**macOS:**
```bash
# Using Homebrew (recommended)
brew install python@3.10
# Or download from python.org
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3.10-dev python3-pip build-essential
```

#### 2. Install Node.js
**Windows/macOS:**
- Download from [nodejs.org](https://nodejs.org/) (LTS version)
- Verify: `node --version` and `npm --version`

**Linux:**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install MongoDB
**Windows:**
- Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- Follow the installer wizard
- MongoDB will run as a Windows service automatically
- Verify: Open "Services" and check "MongoDB Server" is running

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
# Verify
brew services list | grep mongodb
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
# Verify
sudo systemctl status mongod
```

#### 4. Install Git (if not already installed)
**Windows:**
- Download from [git-scm.com](https://git-scm.com/)

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

#### 5. Install Build Tools (Required for some Python packages)
**Windows:**
- Install Visual Studio Build Tools or Visual Studio Community
- Or use: `winget install Microsoft.VisualStudio.2022.BuildTools`

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt install build-essential cmake
```

### Installation Methods

#### Option 1: Automated Setup (Recommended)

1. **Clone the repository:**
```bash
git clone <repository-url>
cd memora
```

2. **Run setup script:**

**Windows:**
```bash
setup.bat
```

**Unix/macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

3. **Download LLM Model (Optional but recommended):**
```bash
# Navigate to backend/models directory
cd backend/models

# Download Mistral 7B Instruct (Q4_K_M - 4.4GB)
# Method 1: Direct download (if curl/wget available)
curl -L -o mistral-7b-instruct-v0.1.Q4_K_M.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"

# Method 2: Manual download
# Visit: https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF
# Download: mistral-7b-instruct-v0.1.Q4_K_M.gguf
# Place in: backend/models/
```

#### Option 2: Manual Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd memora
```

2. **Backend setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

3. **Frontend setup:**
```bash
cd frontend
npm install
```

4. **Environment configuration:**
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Edit the files if needed (default values should work)
```

#### Option 3: Docker Setup (Alternative)

```bash
# Prerequisites: Docker and Docker Compose installed
git clone <repository-url>
cd memora

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Running the Application

#### Method 1: Using Individual Terminals

1. **Start MongoDB** (if not running as service):
```bash
# Windows: Usually runs as service automatically
# macOS:
brew services start mongodb/brew/mongodb-community
# Linux:
sudo systemctl start mongod
```

2. **Start Backend** (Terminal 1):
```bash
cd backend
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Start Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

#### Method 2: Using the Startup Scripts

**Windows:**
```bash
# Start all services
start_app.bat
```

**Unix/macOS/Linux:**
```bash
# Start all services
chmod +x start_app.sh
./start_app.sh
```

### Access Your Application

Once all services are running:

- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017

## Usage Guide

### 1. Upload Documents
- Navigate to "Upload Documents" tab
- Drag & drop PDF files or enter text manually
- Wait for processing and chunking to complete

### 2. Generate Embeddings
- Go to "System Status" tab
- Click "Generate All Embeddings" if not done automatically
- Wait for embedding generation to complete

### 3. Search and Ask Questions
- Use "Ask Questions" tab to query your knowledge base
- The system will find relevant chunks and generate answers
- Adjust the number of chunks to retrieve for better/worse context

### 4. Manage Documents
- View all uploaded documents in "View Documents" tab
- Expand documents to see details and previews
- Delete individual documents or clear entire knowledge base

## Troubleshooting

### Common Issues

#### MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Windows:
services.msc (look for MongoDB Server)
# macOS:
brew services list | grep mongodb
# Linux:
sudo systemctl status mongod

# Restart MongoDB if needed
# Windows: Restart service from Services panel
# macOS:
brew services restart mongodb/brew/mongodb-community
# Linux:
sudo systemctl restart mongod
```

#### Python Package Installation Issues
```bash
# For Windows build errors:
pip install --upgrade setuptools wheel
# Install Visual Studio Build Tools if needed

# For macOS:
xcode-select --install

# For Linux:
sudo apt install python3-dev build-essential
```

#### Port Already in Use
```bash
# Check what's using the ports
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :8000
# macOS/Linux:
lsof -i :3000
lsof -i :8000

# Kill processes if needed
# Windows:
taskkill /PID <PID> /F
# macOS/Linux:
kill -9 <PID>
```

#### LLM Model Issues
- Ensure the model file is in `backend/models/`
- Check file size (should be ~4.4GB for Mistral Q4_K_M)
- Verify filename matches exactly: `mistral-7b-instruct-v0.1.Q4_K_M.gguf`
- Check backend logs for loading errors

### Performance Tips

- **RAM Usage**: LLM requires 4-8GB RAM. Disable if system is low on memory
- **Startup Time**: First run may take longer due to model downloads
- **Search Speed**: Increase chunk retrieval for better context, decrease for faster responses
- **Storage**: Models and embeddings can use significant disk space

## Configuration

### Environment Variables

**Backend (`.env`):**
```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=memora_kb
LLM_MODEL_PATH=models/mistral-7b-instruct-v0.1.Q4_K_M.gguf
EMBEDDING_MODEL=all-MiniLM-L6-v2
LOG_LEVEL=INFO
FAISS_INDEX_PATH=faiss_index.pkl
```

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Customization

- **Change LLM Model**: Replace model file and update `LLM_MODEL_PATH`
- **Database Name**: Modify `DATABASE_NAME` in backend `.env`
- **Embedding Model**: Change `EMBEDDING_MODEL` for different embedding dimensions
- **Chunk Size**: Modify chunk parameters in `backend/app/core/pdf_utils.py`

## API Documentation

The FastAPI backend provides comprehensive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

- `POST /api/v1/upload/` - Upload documents
- `GET /api/v1/documents/` - List documents
- `DELETE /api/v1/documents/{id}` - Delete document
- `POST /api/v1/ask/` - Ask questions
- `GET /api/v1/status/` - System status
- `POST /api/v1/embed/generate-all` - Generate embeddings

## Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Sentence Transformers** for embedding models
- **FAISS** for vector search
- **Mistral AI** for the language model
- **MongoDB** for document storage
- **Next.js** and **FastAPI** for the web framework

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs in terminal outputs
3. Ensure all prerequisites are properly installed
4. Check that all services are running

---

**Built with ❤️ for local, private AI knowledge management**
